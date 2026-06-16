import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { UserRole } from '../common/constants/roles';
import { MenuItem } from '../entities/menu-item.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Order } from '../entities/order.entity';
import { Vendor } from '../entities/vendor.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { WalletService } from '../wallet/wallet.service';
import { GeopayService } from '../geopay/geopay.service';
import { VouchersService } from '../vouchers/vouchers.service';
import { EventsGateway } from '../events/events.gateway';
import {
  haversineKm,
  calculateDeliveryFee,
} from '../common/utils/distance.util';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderItemDto } from './dto/create-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

const sellerTransitions: Record<string, string[]> = {
  pending: ['accepted', 'rejected'],
  accepted: ['preparing'],
  preparing: ['ready_for_pickup'],
};

const riderTransitions: Record<string, string[]> = {
  ready_for_pickup: ['ready_for_pickup', 'picked_up'],
  picked_up: ['delivering'],
  delivering: ['delivered'],
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
    private readonly notificationsService: NotificationsService,
    private readonly walletService: WalletService,
    private readonly geopayService: GeopayService,
    private readonly vouchersService: VouchersService,
    private readonly eventsGateway: EventsGateway,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createOrderDto: CreateOrderDto,
    customerId: string,
  ): Promise<Order> {
    const menuItemIds = createOrderDto.items.map((item) => item.menuItemId);
    if (new Set(menuItemIds).size !== menuItemIds.length) {
      throw new BadRequestException(
        'Duplicate menu items are not allowed in a single order',
      );
    }

    const { savedOrderId, sellerUserId } = await this.dataSource.transaction(
      async (manager) => {
        const vendorRepository = manager.getRepository(Vendor);
        const menuItemRepository = manager.getRepository(MenuItem);
        const orderRepository = manager.getRepository(Order);
        const orderItemRepository = manager.getRepository(OrderItem);

        const vendor = await vendorRepository.findOne({
          where: { id: createOrderDto.vendorId },
        });

        if (!vendor) {
          throw new NotFoundException('Vendor not found');
        }

        if (!vendor.isActive) {
          throw new BadRequestException(
            'Vendor is not accepting orders right now',
          );
        }

        const menuItems = await menuItemRepository.find({
          where: {
            id: In(menuItemIds),
            vendorId: createOrderDto.vendorId,
          },
        });

        if (menuItems.length !== menuItemIds.length) {
          throw new BadRequestException('One or more menu items are invalid');
        }

        const orderItems = createOrderDto.items.map((item) => {
          const menuItem = menuItems.find(
            (candidate) => candidate.id === item.menuItemId,
          );
          if (!menuItem) {
            throw new BadRequestException('Menu item not found in vendor menu');
          }

          if (!menuItem.isAvailable) {
            throw new BadRequestException(
              `Menu item ${menuItem.name} is not available`,
            );
          }

          return {
            menuItem,
            quantity: item.quantity,
            price: Number(menuItem.price),
            name: menuItem.name,
          };
        });

        const subtotal = orderItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );

        let deliveryFee = 0;
        if (
          createOrderDto.orderType !== 'PICKUP' &&
          createOrderDto.deliveryLat !== undefined &&
          createOrderDto.deliveryLng !== undefined
        ) {
          const distanceKm = haversineKm(
            vendor.latitude,
            vendor.longitude,
            createOrderDto.deliveryLat,
            createOrderDto.deliveryLng,
          );
          deliveryFee = calculateDeliveryFee(distanceKm);
        }

        let totalAmount = subtotal + deliveryFee;
        let discountAmount = 0;
        let discountLabel: string | undefined;

        // Apply voucher
        if (createOrderDto.voucherCode) {
          const vd = await this.vouchersService.applyVoucher(
            createOrderDto.voucherCode,
            createOrderDto.vendorId,
            totalAmount,
          );
          discountAmount += vd;
        }

        // Apply points discount balance
        const pointsDiscount = createOrderDto.discountAmount ?? 0;
        if (pointsDiscount > 0) {
          const available = Math.min(
            pointsDiscount,
            totalAmount - discountAmount,
          );
          if (available > 0) {
            await this.geopayService.consumeDiscount(customerId, available);
            discountAmount += available;
          }
        }

        if (discountAmount > 0) {
          totalAmount = Math.max(0, totalAmount - discountAmount);
          const parts: string[] = [];
          if (createOrderDto.voucherCode) parts.push('Voucher');
          if (pointsDiscount > 0) parts.push('Points');
          discountLabel = parts.join(' + ');
        }

        const order = orderRepository.create({
          customerId,
          vendorId: createOrderDto.vendorId,
          status: 'pending',
          totalAmount,
          deliveryFee,
          orderType: createOrderDto.orderType || 'DELIVERY',
          street: createOrderDto.street || createOrderDto.deliveryAddress,
          barangay: createOrderDto.barangay,
          landmark: createOrderDto.landmark,
          floorOrGate: createOrderDto.floorOrGate,
          paymentMethod: createOrderDto.paymentMethod || 'COD',
          paymentStatus: 'pending',
          paymentSessionId: createOrderDto.paymentReference || undefined,
          deliveryLat: createOrderDto.deliveryLat,
          deliveryLng: createOrderDto.deliveryLng,
          notes: createOrderDto.notes,
          discountAmount,
          discountLabel,
        });

        const savedOrder = await orderRepository.save(order);

        const snapshots = orderItems.map((item) =>
          orderItemRepository.create({
            orderId: savedOrder.id,
            menuItemId: item.menuItem.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          }),
        );

        await orderItemRepository.save(snapshots);

        return {
          savedOrderId: savedOrder.id,
          sellerUserId: vendor.userId,
        };
      },
    );

    // Notify seller about new order — REST notification + Socket.IO
    await this.notificationsService.create({
      userId: sellerUserId,
      title: 'New Order',
      message: 'You have received a new order',
      type: 'order_update',
      referenceId: savedOrderId,
    });

    const newOrder = await this.findOneForUser(
      savedOrderId,
      customerId,
      'customer',
    );

    // Push real-time new_order event to the seller
    this.eventsGateway.emitNewOrder(sellerUserId, newOrder);

    return newOrder;
  }

  async findAllForUser(userId: string, role: UserRole, query: QueryOrdersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    try {
      const qb = this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.vendor', 'vendor')
        .leftJoinAndSelect('order.items', 'items')
        .leftJoinAndSelect('order.ratings', 'ratings')
        .leftJoinAndSelect('order.riderRatings', 'riderRatings')
        .orderBy('order.createdAt', 'DESC')
        .skip(skip)
        .take(limit);

      if (role === 'customer') {
        qb.where('order.customerId = :userId', { userId });
      } else if (role === 'seller') {
        const sellerVendor = await this.vendorRepository.findOne({
          where: { userId },
        });
        if (!sellerVendor) {
          return { data: [], total: 0, page, limit };
        }
        qb.where('order.vendorId = :vendorId', { vendorId: sellerVendor.id });
      } else if (role === 'rider') {
        qb.where('order.riderId = :userId', { userId });
      } else {
        throw new BadRequestException(`Invalid role: ${role}`);
      }

      if (query.status) {
        qb.andWhere('order.status = :status', { status: query.status });
      }

      const [data, total] = await qb.getManyAndCount();
      for (const order of data) {
        await this.enrichOrderDetails(order);
      }

      return {
        data,
        total,
        page,
        limit,
      };
    } catch (error) {
      console.error('findAllForUser error:', {
        userId,
        role,
        query,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  async findOneForUser(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: {
        items: true,
        vendor: true,
        ratings: true,
        riderRatings: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.enrichOrderDetails(order);

    if (role === 'customer' && order.customerId !== userId) {
      throw new ForbiddenException('You are not allowed to access this order');
    }

    if (role === 'rider' && order.riderId !== userId) {
      throw new ForbiddenException('You are not allowed to access this order');
    }

    if (role === 'seller') {
      const sellerVendor = await this.vendorRepository.findOne({
        where: { userId },
      });
      if (!sellerVendor || sellerVendor.id !== order.vendorId) {
        throw new ForbiddenException(
          'You are not allowed to access this order',
        );
      }
    }

    return order;
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateOrderStatusDto,
    userId: string,
    role: UserRole,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: {
        vendor: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const nextStatus = updateStatusDto.status as Order['status'];
    const currentStatus = order.status;

    if (role === 'customer') {
      if (order.customerId !== userId) {
        throw new ForbiddenException('You can only update your own orders');
      }
      const cancellableStatuses = ['pending', 'accepted', 'preparing'];
      if (
        !(
          cancellableStatuses.includes(currentStatus) &&
          nextStatus === 'cancelled'
        )
      ) {
        throw new BadRequestException('Invalid customer status transition');
      }
      order.cancellationReason =
        updateStatusDto.cancellationReason || 'Cancelled by customer';
    }

    if (role === 'seller') {
      const sellerVendor = await this.vendorRepository.findOne({
        where: { userId },
      });
      if (!sellerVendor || sellerVendor.id !== order.vendorId) {
        throw new ForbiddenException(
          'You can only update your own vendor orders',
        );
      }

      const allowed = [...(sellerTransitions[currentStatus] ?? [])];
      if (order.orderType === 'PICKUP' && currentStatus === 'ready_for_pickup') {
        allowed.push('delivered');
      }
      if (!allowed.includes(nextStatus)) {
        throw new BadRequestException('Invalid seller status transition');
      }

      // Calculate a basic ETA when the seller starts preparing (e.g. 45 mins from now)
      if (nextStatus === 'preparing') {
        const eta = new Date();
        eta.setMinutes(eta.getMinutes() + 45);
        order.estimatedDeliveryTime = eta;
      }
    }

    if (role === 'rider') {
      const allowed = riderTransitions[currentStatus] ?? [];
      if (!allowed.includes(nextStatus)) {
        throw new BadRequestException('Invalid rider status transition');
      }

      if (order.riderId && order.riderId !== userId) {
        throw new ForbiddenException(
          'Order is already assigned to another rider',
        );
      }

      if (!order.riderId && nextStatus !== 'ready_for_pickup') {
        throw new ForbiddenException(
          'Order must be accepted before updating status',
        );
      }

      if (nextStatus === 'ready_for_pickup' && !order.riderId) {
        // Rider is accepting the delivery - assign them to this order
        order.riderId = userId;
      }
    }

    order.status = nextStatus;
    const updatedOrder = await this.orderRepository.save(order);

    // Emit real-time order_status_updated to the order room and user rooms
    const statusPayload = {
      orderId: updatedOrder.id,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };
    // Broadcast to the order-specific room and to the customer's room
    this.eventsGateway.emitOrderStatusUpdated(
      `order_${updatedOrder.id}`,
      statusPayload,
    );
    this.eventsGateway.emitOrderStatusUpdated(
      `customer_${updatedOrder.customerId}`,
      statusPayload,
    );

    // If cancelled by customer and paid via GeoPay, refund the customer wallet
    if (
      nextStatus === 'cancelled' &&
      role === 'customer' &&
      order.paymentMethod === 'GEOPAY' &&
      order.paymentStatus === 'paid'
    ) {
      try {
        await this.walletService.refundGeoPayOrder(
          order.vendorId,
          order.customerId,
          order.id,
          Number(order.totalAmount),
        );
        this.logger.log(
          `GeoPay refund processed for cancelled order ${order.id}`,
        );
      } catch (refundError) {
        this.logger.error(
          `Failed to process GeoPay refund for order ${order.id}:`,
          refundError,
        );
      }
    }
    // Notify seller and rider when customer cancels
    if (
      nextStatus === 'cancelled' &&
      role === 'customer'
    ) {
      if (order.vendor?.userId) {
        await this.notificationsService.create({
          userId: order.vendor.userId,
          title: 'Order Cancelled',
          message: `Order #${order.id.slice(0, 8)} was cancelled by the customer`,
          type: 'order_update',
          referenceId: order.id,
        });
      }
      if (order.riderId) {
        await this.notificationsService.create({
          userId: order.riderId,
          title: 'Delivery Cancelled',
          message: `Order #${order.id.slice(0, 8)} was cancelled by the customer`,
          type: 'order_update',
          referenceId: order.id,
        });
      }
    }

    // Create notifications based on status change
    if (nextStatus === 'accepted') {
      await this.notificationsService.create({
        userId: order.customerId,
        title: 'Order Accepted',
        message: 'Your order has been accepted by the vendor',
        type: 'order_update',
        referenceId: order.id,
      });

      // Broadcast to all online riders that a new delivery task is available
      if (order.orderType !== 'PICKUP') {
        this.eventsGateway.server.to('riders').emit('notification', {
          id: `delivery_${order.id}`,
          title: 'New Delivery Task Available',
          message: `A new delivery is available from ${order.vendor?.name || 'a local shop'}`,
          type: 'delivery_request',
          referenceId: order.id,
        });
      }
    } else if (nextStatus === 'rejected') {
      await this.notificationsService.create({
        userId: order.customerId,
        title: 'Order Rejected',
        message: 'Your order was rejected by the vendor',
        type: 'order_update',
        referenceId: order.id,
      });
    } else if (nextStatus === 'ready_for_pickup') {
      await this.notificationsService.create({
        userId: order.customerId,
        title: 'Order Ready',
        message: 'Your order is ready for pickup',
        type: 'order_update',
        referenceId: order.id,
      });
    } else if (nextStatus === 'picked_up') {
      await this.notificationsService.create({
        userId: order.customerId,
        title: 'Order Picked Up',
        message: 'Your order has been picked up for delivery',
        type: 'order_update',
        referenceId: order.id,
      });
    } else if (nextStatus === 'delivered') {
      await this.notificationsService.create({
        userId: order.customerId,
        title: 'Order Delivered',
        message: 'Your order has been delivered',
        type: 'order_update',
        referenceId: order.id,
      });
      // Award loyalty points for completed orders
      try {
        await this.geopayService.awardPoints(
          order.customerId,
          Number(order.totalAmount),
          order.id,
        );
        this.logger.log(
          `Reward points awarded for delivered order ${order.id}`,
        );
      } catch (pointsError) {
        this.logger.error(
          `Failed to award points for order ${order.id}:`,
          pointsError,
        );
      }
      // Reward referral on first completed order
      try {
        await this.geopayService.rewardReferralOnFirstOrder(order.customerId);
      } catch (refError) {
        this.logger.error(
          `Failed to reward referral for user ${order.customerId}:`,
          refError,
        );
      }
    }

    return updatedOrder;
  }

  async getAvailableRiders() {
    const isSqlite =
      this.dataSource.options.type === 'better-sqlite3' ||
      this.dataSource.options.type === 'sqljs';
    const query = isSqlite
      ? `
        SELECT 
          u.id, 
          u.name, 
          u.phone,
          rl.lat, 
          rl.lng, 
          rl.updatedAt as lastActive,
          CASE WHEN rl.orderId IS NULL THEN 'available' ELSE 'busy' END as status
        FROM user u
        LEFT JOIN rider_locations rl ON rl.riderId = u.id
        WHERE u.role = 'rider'
      `
      : `
        SELECT 
          u.id, 
          u.name, 
          u.phone,
          rl.lat, 
          rl.lng, 
          rl."updatedAt" as "lastActive",
          CASE WHEN rl."orderId" IS NULL THEN 'available' ELSE 'busy' END as status
        FROM "user" u
        LEFT JOIN "rider_locations" rl ON rl."riderId" = u.id
        WHERE u.role = 'rider'
      `;
    return this.dataSource.query(query);
  }

  async assignRider(
    id: string,
    riderId: string,
    sellerId: string,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: { vendor: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const sellerVendor = await this.vendorRepository.findOne({
      where: { userId: sellerId },
    });

    if (!sellerVendor || sellerVendor.id !== order.vendorId) {
      throw new ForbiddenException(
        'You can only assign riders to your own orders',
      );
    }

    if (
      order.status === 'pending' ||
      order.status === 'rejected' ||
      order.status === 'cancelled' ||
      order.status === 'delivered'
    ) {
      throw new BadRequestException(
        'Cannot assign a rider to this order in its current status',
      );
    }

    const isSqlite =
      this.dataSource.options.type === 'better-sqlite3' ||
      this.dataSource.options.type === 'sqljs';
    const query = isSqlite
      ? `SELECT id FROM user WHERE id = ? AND role = 'rider'`
      : `SELECT id FROM "user" WHERE id = $1 AND role = 'rider'`;

    const params = [riderId];
    const riderExists = await this.dataSource.query(query, params);

    if (!riderExists || riderExists.length === 0) {
      throw new BadRequestException('Invalid rider');
    }

    order.riderId = riderId;
    const updated = await this.orderRepository.save(order);

    await this.notificationsService.create({
      userId: riderId,
      title: 'New Delivery Assigned',
      message: `You have been assigned to deliver order #${order.id.slice(0, 8)}`,
      type: 'delivery_request',
      referenceId: order.id,
    });

    await this.notificationsService.create({
      userId: order.customerId,
      title: 'Rider Assigned',
      message: 'A rider has been assigned to deliver your order',
      type: 'order_update',
      referenceId: order.id,
    });

    return updated;
  }

  async enrichOrderDetails(order: Order): Promise<Order> {
    if (order.riderId) {
      const isSqlite =
        this.dataSource.options.type === 'better-sqlite3' ||
        this.dataSource.options.type === 'sqljs';
      const query = isSqlite
        ? 'SELECT name, phone FROM user WHERE id = ?'
        : 'SELECT name, phone FROM "user" WHERE id = $1';
      const riders = await this.dataSource.query(query, [order.riderId]);
      if (riders && riders[0]) {
        order.riderName = riders[0].name;
        order.riderPhone = riders[0].phone || 'N/A';
      }
    }
    if (order.customerId) {
      const isSqlite =
        this.dataSource.options.type === 'better-sqlite3' ||
        this.dataSource.options.type === 'sqljs';
      const query = isSqlite
        ? 'SELECT name, phone FROM user WHERE id = ?'
        : 'SELECT name, phone FROM "user" WHERE id = $1';
      const customers = await this.dataSource.query(query, [order.customerId]);
      if (customers && customers[0]) {
        order.customerName = customers[0].name;
        order.customerPhone = customers[0].phone || 'N/A';
      }
    }
    if (order.vendor && order.vendor.userId) {
      const isSqlite =
        this.dataSource.options.type === 'better-sqlite3' ||
        this.dataSource.options.type === 'sqljs';
      const query = isSqlite
        ? 'SELECT phone FROM user WHERE id = ?'
        : 'SELECT phone FROM "user" WHERE id = $1';
      const sellers = await this.dataSource.query(query, [order.vendor.userId]);
      if (sellers && sellers[0]) {
        order.vendorPhone = sellers[0].phone || 'N/A';
      }
    }
    return order;
  }
}
