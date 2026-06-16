import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { decimalNumberTransformer } from '../database/decimal-number.transformer';

@Entity('reward_transactions')
@Index(['userId'])
@Index(['createdAt'])
export class RewardTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  userId!: string;

  @Column({ type: 'int' })
  points!: number;

  @Column({
    type: process.env.DB_TYPE === 'sqlite' ? 'simple-enum' : 'enum',
    enum: ['earned', 'redeemed', 'expired'],
  })
  type!: 'earned' | 'redeemed' | 'expired';

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimalNumberTransformer,
  })
  cashValue!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  referenceId?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
