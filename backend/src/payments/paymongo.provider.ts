import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface CreateSessionPayload {
  orderId: string;
  amount: number; // in PHP, will be converted to centavos internally
  paymentMethod: 'GCASH' | 'MAYA' | 'QRPH';
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
}

@Injectable()
export class PayMongoProvider {
  private readonly logger = new Logger(PayMongoProvider.name);
  private readonly baseUrl = 'https://api.paymongo.com/v1';

  private getSecretKey(): string {
    return process.env.PAYMONGO_SECRET_KEY || '';
  }

  private getWebhookSecret(): string {
    return process.env.PAYMONGO_WEBHOOK_SECRET || '';
  }

  private getAuthHeader(): string {
    const key = this.getSecretKey();
    return `Basic ${Buffer.from(`${key}:`).toString('base64')}`;
  }

  /**
   * Creates a checkout session in PayMongo for the specified payment method.
   */
  async createCheckoutSession(payload: CreateSessionPayload) {
    const secretKey = this.getSecretKey();
    if (!secretKey) {
      throw new Error('PAYMONGO_SECRET_KEY is not configured in environment.');
    }

    const centavos = Math.round(payload.amount * 100);
    const frontendUrl = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')[0]
      : 'http://localhost:5173';

    // Map internal payment methods to PayMongo payment method types
    let paymongoMethod: string;
    switch (payload.paymentMethod) {
      case 'GCASH':
        paymongoMethod = 'gcash';
        break;
      case 'MAYA':
        paymongoMethod = 'paymaya';
        break;
      case 'QRPH':
        paymongoMethod = 'qrph';
        break;
      default:
        paymongoMethod = 'gcash';
    }

    const body = {
      data: {
        attributes: {
          show_description: true,
          show_line_items: true,
          cancel_url: `${frontendUrl}/orders/${payload.orderId}`,
          success_url: `${frontendUrl}/orders/${payload.orderId}?success=true`,
          description: `Geobites Order #${payload.orderId.slice(0, 8)}`,
          line_items: [
            {
              amount: centavos,
              currency: 'PHP',
              name: `Geobites Food Order #${payload.orderId.slice(0, 8)}`,
              quantity: 1,
            },
          ],
          payment_method_types: [paymongoMethod],
          metadata: {
            orderId: payload.orderId,
          },
        },
      },
    };

    try {
      const response = await fetch(`${this.baseUrl}/checkout_sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: this.getAuthHeader(),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `PayMongo session creation failed: ${response.status} - ${errorText}`,
        );
        throw new Error(`PayMongo API error: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        sessionId: result.data.id,
        checkoutUrl: result.data.attributes.checkout_url,
      };
    } catch (error) {
      this.logger.error('Failed to create PayMongo checkout session', error);
      throw error;
    }
  }

  /**
   * Retrieves a checkout session status directly from PayMongo.
   */
  async retrieveCheckoutSession(
    sessionId: string,
  ): Promise<{ isPaid: boolean; status: string }> {
    const secretKey = this.getSecretKey();
    if (!secretKey) {
      throw new Error('PAYMONGO_SECRET_KEY is not configured in environment.');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/checkout_sessions/${sessionId}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: this.getAuthHeader(),
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `PayMongo retrieve session failed: ${response.status} - ${errorText}`,
        );
        throw new Error(`PayMongo API error: ${response.statusText}`);
      }

      const result = await response.json();
      const attributes = result?.data?.attributes;

      const payments = attributes?.payments || [];
      const hasSucceededPayment = payments.some(
        (payment: any) => payment?.attributes?.status === 'succeeded',
      );

      const intentStatus = attributes?.payment_intent?.attributes?.status;
      const isPaid = hasSucceededPayment || intentStatus === 'succeeded';

      return {
        isPaid,
        status: attributes?.status || 'unknown',
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve PayMongo checkout session: ${sessionId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Verifies incoming webhook signature from PayMongo.
   */
  verifyWebhookSignature(payload: string, signatureHeader: string): boolean {
    const webhookSecret = this.getWebhookSecret();
    if (!webhookSecret) {
      this.logger.warn(
        'PAYMONGO_WEBHOOK_SECRET is not set. Skipping signature verification.',
      );
      return true; // Bypass signature if not set (useful for easy test deployment)
    }

    try {
      // PayMongo signature format: t=timestamp,te=signature,li=signature
      const parts = signatureHeader.split(',');
      const timestampPart = parts.find((p) => p.startsWith('t='));
      const signaturePart = parts.find(
        (p) => p.startsWith('te=') || p.startsWith('li='),
      );

      if (!timestampPart || !signaturePart) {
        return false;
      }

      const timestamp = timestampPart.split('=')[1];
      const signature = signaturePart.split('=')[1];

      // Recreate signature base string: timestamp + "." + payload
      const baseString = `${timestamp}.${payload}`;
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(baseString)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      this.logger.error('Error verifying PayMongo webhook signature', error);
      return false;
    }
  }
}
