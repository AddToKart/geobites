import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { decimalNumberTransformer } from '../database/decimal-number.transformer';

@Entity('wallet_transactions')
@Index(['walletId'])
@Index(['createdAt'])
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  walletId!: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalNumberTransformer,
  })
  amount!: number;

  @Column({
    type: process.env.DB_TYPE === 'sqlite' ? 'simple-enum' : 'enum',
    enum: ['cash_in', 'payment', 'refund', 'vendor_payout', 'withdrawal'],
  })
  type!: 'cash_in' | 'payment' | 'refund' | 'vendor_payout' | 'withdrawal';

  @Column({ type: 'varchar', length: 255, nullable: true })
  referenceId?: string; // e.g., orderId, or external checkout sessionId

  @Column({
    type: process.env.DB_TYPE === 'sqlite' ? 'simple-enum' : 'enum',
    enum: ['pending', 'success', 'failed'],
    default: 'pending',
  })
  status!: 'pending' | 'success' | 'failed';

  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentMethod?: string; // GCASH, MAYA, QRPH, etc.

  @CreateDateColumn()
  createdAt!: Date;
}
