import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserRole } from '../common/constants/roles';
import { MenuItem } from '../entities/menu-item.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Order } from '../entities/order.entity';
import { Vendor } from '../entities/vendor.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOrderDto } from './dto/create-order.dto';
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
  ) {}

  async create(
    createOrderDto: CreateOrderDto,
    customerId: string,
  ): Promise<Order> {
    const vendor = await this.vendorRepository.findOne({
      where: { id: createOrderDto.vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const menuItemIds = createOrderDto.items.map((item) => item.menuItemId);
    const menuItems = await this.menuItemRepository.find({
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

    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const order = this.orderRepository.create({
      customerId,
      vendorId: createOrderDto.vendorId,
      status: 'pending',
      totalAmount,
      deliveryAddress: createOrderDto.deliveryAddress,
      deliveryLat: createOrderDto.deliveryLat,
      deliveryLng: createOrderDto.deliveryLng,
      notes: createOrderDto.notes,
    });

    const savedOrder = await this.orderRepository.save(order);

    const snapshots = orderItems.map((item) =>
      this.orderItemRepository.create({
        orderId: savedOrder.id,
        menuItemId: item.menuItem.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      }),
    );

    await this.orderItemRepository.save(snapshots);

    // Notify seller about new order
    await this.notificationsService.create({
      userId: vendor.userId,
      title: 'New Order',
      message: 'You have received a new order',
      type: 'order_update',
      referenceId: savedOrder.id,
    });

    return this.findOneForUser(savedOrder.id, customerId, 'customer');
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
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

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
      if (!(currentStatus === 'pending' && nextStatus === 'cancelled')) {
        throw new BadRequestException('Invalid customer status transition');
      }
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

      const allowed = sellerTransitions[currentStatus] ?? [];
      if (!allowed.includes(nextStatus)) {
        throw new BadRequestException('Invalid seller status transition');
      }
    }

    if (role === 'rider') {
      const allowed = riderTransitions[currentStatus] ?? [];
      if (!allowed.includes(nextStatus)) {
        throw new BadRequestException('Invalid rider status transition');
      }

      if (nextStatus === 'ready_for_pickup' && !order.riderId) {
        // Rider is accepting the delivery - assign them to this order
        order.riderId = userId;
      } else if (order.riderId && order.riderId !== userId) {
        // This order is already assigned to another rider
        throw new ForbiddenException('Order is already assigned to another rider');
      }
    }

    order.status = nextStatus;
    const updatedOrder = await this.orderRepository.save(order);

    // Create notifications based on status change
    if (nextStatus === 'accepted') {
      await this.notificationsService.create({
        userId: order.customerId,
        title: 'Order Accepted',
        message: 'Your order has been accepted by the vendor',
        type: 'order_update',
        referenceId: order.id,
      });
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
    }

    return updatedOrder;
  }
}
