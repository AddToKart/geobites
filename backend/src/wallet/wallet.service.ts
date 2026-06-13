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

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly transactionRepository: Repository<WalletTransaction>,
    private readonly dataSource: DataSource,
  ) {}

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
   * Retrieves transaction history for a customer.
   */
  async getTransactionHistory(
    customerId: string,
  ): Promise<WalletTransaction[]> {
    const wallet = await this.getOrCreateWallet(customerId);
    return this.transactionRepository.find({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
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

    // Create a pending wallet transaction
    const transaction = this.transactionRepository.create({
      walletId: wallet.id,
      amount,
      type: 'cash_in',
      status: 'pending',
      paymentMethod,
    });
    const savedTransaction = await this.transactionRepository.save(transaction);

    // Build redirect URL for payment simulator
    const frontendUrl = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')[0]
      : 'http://localhost:5173';

    // Fallback URL to local payment simulator
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
        return transaction; // Already processed
      }

      const wallet = await walletRepo.findOne({
        where: { id: transaction.walletId },
      });

      if (!wallet) {
        throw new NotFoundException(
          'Wallet associated with transaction not found',
        );
      }

      // Update wallet balance
      wallet.balance = Number(wallet.balance) + Number(transaction.amount);
      await walletRepo.save(wallet);

      // Update transaction status
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

      // Deduct balance
      wallet.balance = Number(wallet.balance) - Number(amount);
      await walletRepo.save(wallet);

      // Create transaction record
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
}
