import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { PayMongoProvider } from './paymongo.provider';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly payMongoProvider: PayMongoProvider,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Initiates payment for a digital payment order (GCash, Maya, QRPh, GeoPay).
   * Generates a PayMongo checkout session URL and stores the session ID.
   */
  async processPayment(orderId: string, customerId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.customerId !== customerId) {
      throw new BadRequestException('Not authorized to pay for this order');
    }

    if (order.paymentStatus === 'paid') {
      return { checkoutUrl: null, status: 'paid' };
    }

    if (order.paymentMethod === 'GEOPAY') {
      await this.walletService.processOrderPayment(
        customerId,
        order.id,
        order.totalAmount,
      );
      order.paymentStatus = 'paid';
      await this.orderRepository.save(order);
      return { checkoutUrl: null, status: 'paid' };
    }

    if (order.paymentMethod === 'COD') {
      throw new BadRequestException('COD orders are paid upon delivery');
    }

    // Check if we have configured PayMongo keys; fallback to local mock if not
    if (!process.env.PAYMONGO_SECRET_KEY) {
      const frontendUrl = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',')[0]
        : 'http://localhost:5173';
      order.paymentSessionId = `mock_session_${order.id}`;
      await this.orderRepository.save(order);
      return {
        checkoutUrl: `${frontendUrl}/mock-payment?orderId=${order.id}&amount=${order.totalAmount}&method=${order.paymentMethod}`,
        status: 'pending',
      };
    }

    // If session already exists, retrieve it to check status or reuse URL
    if (order.paymentSessionId) {
      try {
        const session = await this.payMongoProvider.retrieveCheckoutSession(
          order.paymentSessionId,
        );
        if (session.isPaid) {
          order.paymentStatus = 'paid';
          await this.orderRepository.save(order);
          return { checkoutUrl: null, status: 'paid' };
        }
        // Query PayMongo again to get checkout url (or recreate if expired)
        // Checkout sessions last 24h, so we can re-query to get the URL
      } catch (error: any) {
        this.logger.warn(
          `Could not retrieve existing session ${order.paymentSessionId}: ${error.message}. Creating a new one.`,
        );
      }
    }

    // Resolve customer details (can be placeholder or user entity if available)
    const session = await this.payMongoProvider.createCheckoutSession({
      orderId: order.id,
      amount: Number(order.totalAmount),
      paymentMethod: order.paymentMethod,
      customerName: 'Geobites Customer',
    });

    order.paymentSessionId = session.sessionId;
    await this.orderRepository.save(order);

    return {
      checkoutUrl: session.checkoutUrl,
      status: 'pending',
    };
  }

  /**
   * Direct status verification (Polling backup).
   * Fetches current state directly from PayMongo and updates local database.
   */
  async verifySessionStatus(orderId: string, customerId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: {
        items: true,
        vendor: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.customerId !== customerId) {
      throw new BadRequestException(
        'Not authorized to check this order status',
      );
    }

    if (order.paymentStatus === 'paid') {
      return order;
    }

    if (!order.paymentSessionId) {
      return order; // No session initiated yet
    }

    try {
      const session = await this.payMongoProvider.retrieveCheckoutSession(
        order.paymentSessionId,
      );

      if (session.isPaid) {
        order.paymentStatus = 'paid';
        await this.orderRepository.save(order);
        this.logger.log(
          `Order ${order.id} payment status verified as PAID via PayMongo polling.`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error polling checkout session status for order ${order.id}`,
        error,
      );
    }

    return order;
  }

  /**
   * Public webhook handler for payment success events.
   */
  async handleWebhook(body: any, signature: string) {
    // 1. Verify Signature
    const rawBody = JSON.stringify(body);
    const isValid = this.payMongoProvider.verifyWebhookSignature(
      rawBody,
      signature,
    );

    if (!isValid) {
      this.logger.warn('Received invalid webhook signature from PayMongo');
      throw new BadRequestException('Invalid signature');
    }

    const eventType = body?.data?.attributes?.type;
    this.logger.log(`Processing webhook event: ${eventType}`);

    if (eventType === 'checkout_session.payment.paid') {
      const sessionData = body?.data?.attributes?.data;
      const sessionId = sessionData?.id;
      const orderId = sessionData?.attributes?.metadata?.orderId;

      let order: Order | null = null;
      if (orderId) {
        order = await this.orderRepository.findOne({ where: { id: orderId } });
      }
      if (!order && sessionId) {
        order = await this.orderRepository.findOne({
          where: { paymentSessionId: sessionId },
        });
      }

      if (order) {
        if (order.paymentStatus !== 'paid') {
          order.paymentStatus = 'paid';
          await this.orderRepository.save(order);
          this.logger.log(
            `Order ${order.id} payment status updated to PAID via Webhook.`,
          );
        }
      } else {
        this.logger.warn(
          `Webhook received for session ${sessionId} / order ${orderId} but order was not found`,
        );
      }
    }

    return { received: true };
  }

  async markCodAsPaid(orderId: string, riderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.riderId !== riderId) {
      throw new BadRequestException(
        'Only the assigned rider can mark COD as paid',
      );
    }

    if (order.paymentMethod !== 'COD') {
      throw new BadRequestException('Order is not COD');
    }

    order.paymentStatus = 'paid';
    return this.orderRepository.save(order);
  }

  async simulateLocalPaymentSuccess(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      await this.orderRepository.save(order);
      this.logger.log(
        `Order ${order.id} payment status updated to PAID via local simulation.`,
      );
    }

    return { success: true };
  }

  async verifyManualPayment(orderId: string, sellerId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: { vendor: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.vendor.userId !== sellerId) {
      throw new BadRequestException(
        'Not authorized to verify payment for this order',
      );
    }

    if (order.paymentStatus === 'paid') {
      throw new BadRequestException('Payment is already marked as paid');
    }

    order.paymentStatus = 'paid';
    return this.orderRepository.save(order);
  }
}
