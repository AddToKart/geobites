import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from '../entities/wallet.entity';
import { WalletTransaction } from '../entities/wallet-transaction.entity';
import { WithdrawalRequest } from '../entities/withdrawal-request.entity';
import { Order } from '../entities/order.entity';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly transactionRepository: Repository<WalletTransaction>,
    @InjectRepository(WithdrawalRequest)
    private readonly withdrawalRepository: Repository<WithdrawalRequest>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Refunds a GeoPay order on cancellation: credits customer wallet,
   * debits vendor wallet.
   */
  async refundGeoPayOrder(
    vendorId: string,
    customerId: string,
    orderId: string,
    amount: number,
  ): Promise<{
    customerTransaction: WalletTransaction;
    vendorTransaction: WalletTransaction | null;
  }> {
    return await this.dataSource.transaction(async (manager) => {
      const walletRepo = manager.getRepository(Wallet);
      const transactionRepo = manager.getRepository(WalletTransaction);

      let customerWallet = await walletRepo.findOne({ where: { customerId } });
      if (!customerWallet) {
        customerWallet = walletRepo.create({ customerId, balance: 0.0 });
        customerWallet = await walletRepo.save(customerWallet);
      }
      customerWallet.balance = Number(customerWallet.balance) + Number(amount);
      await walletRepo.save(customerWallet);

      const customerTxn = transactionRepo.create({
        walletId: customerWallet.id,
        amount,
        type: 'refund',
        status: 'success',
        referenceId: orderId,
        paymentMethod: 'GEOPAY',
      });
      const savedCustomerTxn = await transactionRepo.save(customerTxn);

      let savedVendorTxn: WalletTransaction | null = null;
      const vendorWallet = await walletRepo.findOne({ where: { vendorId } });
      if (vendorWallet) {
        vendorWallet.balance = Math.max(
          0,
          Number(vendorWallet.balance) - Number(amount),
        );
        await walletRepo.save(vendorWallet);

        const vendorTxn = transactionRepo.create({
          walletId: vendorWallet.id,
          amount: -amount,
          type: 'vendor_refund',
          status: 'success',
          referenceId: orderId,
          paymentMethod: 'GEOPAY',
        });
        savedVendorTxn = await transactionRepo.save(vendorTxn);
      }

      this.logger.log(
        `Refunded ₱${amount} for order ${orderId}: customer ${customerId} credited, vendor ${vendorId} debited`,
      );
      return {
        customerTransaction: savedCustomerTxn,
        vendorTransaction: savedVendorTxn,
      };
    });
  }

  /**
   * Gets or creates a wallet for a customer.
   */
  async getOrCreateWallet(customerId: string): Promise<Wallet> {
    let wallet = await this.walletRepository.findOne({
      where: { customerId },
    });

    if (!wallet) {
      wallet = this.walletRepository.create({
        customerId,
        balance: 0.0,
      });
      wallet = await this.walletRepository.save(wallet);
      this.logger.log(`Created new wallet for customer ${customerId}`);
    }

    return wallet;
  }

  /**
   * Gets or creates a wallet for a vendor.
   */
  async getOrCreateVendorWallet(vendorId: string): Promise<Wallet> {
    let wallet = await this.walletRepository.findOne({
      where: { vendorId },
    });

    if (!wallet) {
      wallet = this.walletRepository.create({
        vendorId,
        balance: 0.0,
      });
      wallet = await this.walletRepository.save(wallet);
      this.logger.log(`Created new vendor wallet for vendor ${vendorId}`);
    }

    return wallet;
  }

  /**
   * Retrieves transaction history for a customer.
   */
  async getTransactionHistory(
    customerId: string,
    page = 1,
    limit = 15,
  ): Promise<{
    data: WalletTransaction[];
    total: number;
    page: number;
    limit: number;
  }> {
    const wallet = await this.getOrCreateWallet(customerId);
    const [data, total] = await this.transactionRepository.findAndCount({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  /**
   * Retrieves transaction history for a vendor.
   */
  async getVendorTransactionHistory(
    vendorId: string,
  ): Promise<WalletTransaction[]> {
    const wallet = await this.getOrCreateVendorWallet(vendorId);
    return this.transactionRepository.find({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Credits the vendor's wallet when a GeoPay order is paid.
   * The amount credited is the order total minus platform fee.
   */
  async creditVendorFromGeoPay(
    vendorId: string,
    orderId: string,
    amount: number,
  ): Promise<WalletTransaction> {
    return await this.dataSource.transaction(async (manager) => {
      const walletRepo = manager.getRepository(Wallet);
      const transactionRepo = manager.getRepository(WalletTransaction);

      let wallet = await walletRepo.findOne({ where: { vendorId } });
      if (!wallet) {
        wallet = walletRepo.create({ vendorId, balance: 0.0 });
        wallet = await walletRepo.save(wallet);
      }

      wallet.balance = Number(wallet.balance) + Number(amount);
      await walletRepo.save(wallet);

      const transaction = transactionRepo.create({
        walletId: wallet.id,
        amount,
        type: 'vendor_payout',
        status: 'success',
        referenceId: orderId,
        paymentMethod: 'GEOPAY',
      });

      const saved = await transactionRepo.save(transaction);
      this.logger.log(
        `Credited ₱${amount} to vendor wallet ${wallet.id} for order ${orderId}. New balance: ₱${wallet.balance}`,
      );
      return saved;
    });
  }

  /**
   * Initiates a cash-in transaction.
   * Generates a payment URL (simulated or PayMongo-based).
   */
  async initiateCashIn(
    customerId: string,
    amount: number,
    paymentMethod: 'GCASH' | 'MAYA' | 'QRPH',
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Cash-in amount must be greater than zero');
    }

    const wallet = await this.getOrCreateWallet(customerId);

    const transaction = this.transactionRepository.create({
      walletId: wallet.id,
      amount,
      type: 'cash_in',
      status: 'pending',
      paymentMethod,
    });
    const savedTransaction = await this.transactionRepository.save(transaction);

    const frontendUrl = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')[0]
      : 'http://localhost:5173';

    const checkoutUrl = `${frontendUrl}/mock-payment?cashInId=${savedTransaction.id}&amount=${amount}&method=${paymentMethod}`;

    return {
      transactionId: savedTransaction.id,
      checkoutUrl,
      status: 'pending',
    };
  }

  /**
   * Initiates a vendor cash-in transaction.
   * Generates a payment URL (simulated or PayMongo-based).
   */
  async initiateVendorCashIn(
    vendorId: string,
    amount: number,
    paymentMethod: 'GCASH' | 'MAYA' | 'QRPH',
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Cash-in amount must be greater than zero');
    }

    const wallet = await this.getOrCreateVendorWallet(vendorId);

    const transaction = this.transactionRepository.create({
      walletId: wallet.id,
      amount,
      type: 'cash_in',
      status: 'pending',
      paymentMethod,
    });
    const savedTransaction = await this.transactionRepository.save(transaction);

    const frontendUrl = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')[0]
      : 'http://localhost:5173';

    const checkoutUrl = `${frontendUrl}/mock-payment?cashInId=${savedTransaction.id}&amount=${amount}&method=${paymentMethod}`;

    return {
      transactionId: savedTransaction.id,
      checkoutUrl,
      status: 'pending',
    };
  }

  /**
   * Completes a pending cash-in transaction (adds money to wallet).
   */
  async completeCashIn(transactionId: string): Promise<WalletTransaction> {
    return await this.dataSource.transaction(async (manager) => {
      const transactionRepo = manager.getRepository(WalletTransaction);
      const walletRepo = manager.getRepository(Wallet);

      const transaction = await transactionRepo.findOne({
        where: { id: transactionId },
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      if (transaction.type !== 'cash_in') {
        throw new BadRequestException('Invalid transaction type for cash-in');
      }

      if (transaction.status === 'success') {
        return transaction;
      }

      const wallet = await walletRepo.findOne({
        where: { id: transaction.walletId },
      });

      if (!wallet) {
        throw new NotFoundException(
          'Wallet associated with transaction not found',
        );
      }

      wallet.balance = Number(wallet.balance) + Number(transaction.amount);
      await walletRepo.save(wallet);

      transaction.status = 'success';
      const updatedTransaction = await transactionRepo.save(transaction);

      this.logger.log(
        `Completed cash-in of ₱${transaction.amount} for wallet ${wallet.id}. New balance: ₱${wallet.balance}`,
      );

      return updatedTransaction;
    });
  }

  /**
   * Deducts funds from customer wallet for order payment.
   */
  async processOrderPayment(
    customerId: string,
    orderId: string,
    amount: number,
  ): Promise<WalletTransaction> {
    return await this.dataSource.transaction(async (manager) => {
      const walletRepo = manager.getRepository(Wallet);
      const transactionRepo = manager.getRepository(WalletTransaction);

      const wallet = await walletRepo.findOne({
        where: { customerId },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      if (Number(wallet.balance) < Number(amount)) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      wallet.balance = Number(wallet.balance) - Number(amount);
      await walletRepo.save(wallet);

      const transaction = transactionRepo.create({
        walletId: wallet.id,
        amount: -amount,
        type: 'payment',
        status: 'success',
        referenceId: orderId,
        paymentMethod: 'GEOPAY',
      });

      const savedTransaction = await transactionRepo.save(transaction);
      this.logger.log(
        `Charged ₱${amount} from wallet ${wallet.id} for order ${orderId}. New balance: ₱${wallet.balance}`,
      );

      return savedTransaction;
    });
  }

  /**
   * Requests a withdrawal from vendor wallet to a bank or e-wallet.
   */
  async requestWithdrawal(
    vendorId: string,
    amount: number,
    accountDetails: {
      accountName: string;
      accountNumber: string;
      accountType: 'bank' | 'ewallet';
      accountProvider: string;
    },
  ): Promise<WithdrawalRequest> {
    if (amount <= 0) {
      throw new BadRequestException(
        'Withdrawal amount must be greater than zero',
      );
    }

    const wallet = await this.getOrCreateVendorWallet(vendorId);
    if (Number(wallet.balance) < Number(amount)) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    return await this.dataSource.transaction(async (manager) => {
      const walletRepo = manager.getRepository(Wallet);
      const withdrawalRepo = manager.getRepository(WithdrawalRequest);
      const transactionRepo = manager.getRepository(WalletTransaction);

      const w = await walletRepo.findOne({ where: { vendorId } });
      if (!w) throw new NotFoundException('Vendor wallet not found');

      w.balance = Number(w.balance) - Number(amount);
      await walletRepo.save(w);

      const withdrawal = withdrawalRepo.create({
        vendorId,
        amount,
        status: 'pending',
        accountName: accountDetails.accountName,
        accountNumber: accountDetails.accountNumber,
        accountType: accountDetails.accountType,
        accountProvider: accountDetails.accountProvider,
      });
      const saved = await withdrawalRepo.save(withdrawal);

      const tx = transactionRepo.create({
        walletId: w.id,
        amount: -amount,
        type: 'withdrawal',
        status: 'success',
        referenceId: saved.id,
        paymentMethod: 'WITHDRAWAL',
      });
      await transactionRepo.save(tx);

      this.logger.log(
        `Withdrawal of ₱${amount} requested for vendor wallet ${w.id}. New balance: ₱${w.balance}`,
      );

      return saved;
    });
  }

  /**
   * Returns withdrawal history for a vendor.
   */
  async getWithdrawalHistory(vendorId: string): Promise<WithdrawalRequest[]> {
    return this.withdrawalRepository.find({
      where: { vendorId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Requests a withdrawal from customer/rider wallet to a bank or e-wallet.
   */
  async requestCustomerWithdrawal(
    customerId: string,
    amount: number,
    accountDetails: {
      accountName: string;
      accountNumber: string;
      accountType: 'bank' | 'ewallet';
      accountProvider: string;
    },
  ): Promise<WithdrawalRequest> {
    if (amount <= 0) {
      throw new BadRequestException(
        'Withdrawal amount must be greater than zero',
      );
    }

    const wallet = await this.getOrCreateWallet(customerId);
    if (Number(wallet.balance) < Number(amount)) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    return await this.dataSource.transaction(async (manager) => {
      const walletRepo = manager.getRepository(Wallet);
      const withdrawalRepo = manager.getRepository(WithdrawalRequest);
      const transactionRepo = manager.getRepository(WalletTransaction);

      const w = await walletRepo.findOne({ where: { customerId } });
      if (!w) throw new NotFoundException('Wallet not found');

      w.balance = Number(w.balance) - Number(amount);
      await walletRepo.save(w);

      const withdrawal = withdrawalRepo.create({
        vendorId: customerId, // use customerId in vendorId column as it is generic varchar
        amount,
        status: 'pending',
        accountName: accountDetails.accountName,
        accountNumber: accountDetails.accountNumber,
        accountType: accountDetails.accountType,
        accountProvider: accountDetails.accountProvider,
      });
      const saved = await withdrawalRepo.save(withdrawal);

      const tx = transactionRepo.create({
        walletId: w.id,
        amount: -amount,
        type: 'withdrawal',
        status: 'success',
        referenceId: saved.id,
        paymentMethod: 'WITHDRAWAL',
      });
      await transactionRepo.save(tx);

      this.logger.log(
        `Withdrawal of ₱${amount} requested for customer/rider wallet ${w.id}. New balance: ₱${w.balance}`,
      );

      return saved;
    });
  }

  /**
   * Returns withdrawal history for a customer/rider.
   */
  async getCustomerWithdrawalHistory(
    customerId: string,
  ): Promise<WithdrawalRequest[]> {
    return this.withdrawalRepository.find({
      where: { vendorId: customerId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Processes the payout splits on delivery completion:
   * Credits the rider with the delivery fee (for online payment orders).
   * Credits the vendor with the subtotal (for online payment orders).
   */
  async handleOrderDeliveryPayout(orderId: string): Promise<void> {
    return await this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const walletRepo = manager.getRepository(Wallet);
      const transactionRepo = manager.getRepository(WalletTransaction);

      const order = await orderRepo.findOne({
        where: { id: orderId },
        relations: { vendor: true },
      });

      if (!order || order.status !== 'delivered') {
        return;
      }

      this.logger.log(
        `Processing order delivery payout for order ${order.id} (Total: ₱${order.totalAmount}, Delivery Fee: ₱${order.deliveryFee}, Payment Method: ${order.paymentMethod})`,
      );

      // 1. Pay the Rider their Delivery Fee (if a rider is assigned and it's a delivery order)
      if (
        order.orderType === 'DELIVERY' &&
        order.riderId &&
        Number(order.deliveryFee) > 0
      ) {
        let riderWallet = await walletRepo.findOne({
          where: { customerId: order.riderId },
        });

        if (!riderWallet) {
          riderWallet = walletRepo.create({
            customerId: order.riderId,
            balance: 0.0,
          });
          riderWallet = await walletRepo.save(riderWallet);
        }

        // We only pay the rider digitally if the payment was online (not COD)
        if (order.paymentMethod !== 'COD') {
          // If it was GEOPAY, the vendor was credited totalAmount upfront, so we deduct deliveryFee from vendor
          if (order.paymentMethod === 'GEOPAY' && order.vendor) {
            const vendorWallet = await walletRepo.findOne({
              where: { vendorId: order.vendor.id },
            });
            if (vendorWallet) {
              vendorWallet.balance = Math.max(
                0,
                Number(vendorWallet.balance) - Number(order.deliveryFee),
              );
              await walletRepo.save(vendorWallet);

              // Record transaction for vendor deduction
              const vendorTxn = transactionRepo.create({
                walletId: vendorWallet.id,
                amount: -Number(order.deliveryFee),
                type: 'withdrawal',
                status: 'success',
                referenceId: order.id,
                paymentMethod: 'GEOPAY',
              });
              await transactionRepo.save(vendorTxn);
              this.logger.log(
                `Deducted ₱${order.deliveryFee} delivery fee from vendor ${order.vendor.id} wallet for GEOPAY order`,
              );
            }
          }

          // Credit the rider's wallet
          riderWallet.balance =
            Number(riderWallet.balance) + Number(order.deliveryFee);
          await walletRepo.save(riderWallet);

          // Record rider credit transaction
          const riderTxn = transactionRepo.create({
            walletId: riderWallet.id,
            amount: Number(order.deliveryFee),
            type: 'cash_in',
            status: 'success',
            referenceId: order.id,
            paymentMethod: order.paymentMethod,
          });
          await transactionRepo.save(riderTxn);
          this.logger.log(
            `Credited ₱${order.deliveryFee} delivery fee to rider ${order.riderId} wallet`,
          );
        }
      }

      // 2. Pay the Vendor their Subtotal if payment was GCASH, MAYA, or QRPH
      // (For GEOPAY, the vendor was already credited totalAmount upfront, which we just adjusted above)
      if (
        (order.paymentMethod === 'GCASH' ||
          order.paymentMethod === 'MAYA' ||
          order.paymentMethod === 'QRPH') &&
        order.vendor
      ) {
        let vendorWallet = await walletRepo.findOne({
          where: { vendorId: order.vendor.id },
        });

        if (!vendorWallet) {
          vendorWallet = walletRepo.create({
            vendorId: order.vendor.id,
            balance: 0.0,
          });
          vendorWallet = await walletRepo.save(vendorWallet);
        }

        const vendorShare =
          Number(order.totalAmount) - Number(order.deliveryFee);
        if (vendorShare > 0) {
          vendorWallet.balance = Number(vendorWallet.balance) + vendorShare;
          await walletRepo.save(vendorWallet);

          const vendorTxn = transactionRepo.create({
            walletId: vendorWallet.id,
            amount: vendorShare,
            type: 'vendor_credit',
            status: 'success',
            referenceId: order.id,
            paymentMethod: order.paymentMethod,
          });
          await transactionRepo.save(vendorTxn);
          this.logger.log(
            `Credited ₱${vendorShare} vendor share to vendor ${order.vendor.id} wallet for ${order.paymentMethod} order`,
          );
        }
      }
    });
  }
}
