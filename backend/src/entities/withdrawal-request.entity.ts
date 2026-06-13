import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { decimalNumberTransformer } from '../database/decimal-number.transformer';

@Entity('withdrawal_requests')
@Index(['vendorId'])
@Index(['status'])
export class WithdrawalRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  vendorId!: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalNumberTransformer,
  })
  amount!: number;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'pending',
  })
  status!: 'pending' | 'processing' | 'completed' | 'failed';

  @Column({ type: 'varchar', length: 255 })
  accountName!: string;

  @Column({ type: 'varchar', length: 255 })
  accountNumber!: string;

  @Column({ type: 'varchar', length: 50 })
  accountType!: string; // bank | ewallet

  @Column({ type: 'varchar', length: 255 })
  accountProvider!: string; // BDO, GCASH, Maya, BPI, etc.

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
