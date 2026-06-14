import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { decimalNumberTransformer } from '../database/decimal-number.transformer';

@Entity('referrals')
@Index(['referralCode'], { unique: true })
@Index(['referrerId'])
@Index(['referredId'], { unique: true })
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  referralCode!: string;

  @Column({ type: 'varchar', length: 255 })
  referrerId!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  referredId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  referredEmail?: string;

  @Column({
    type: process.env.DB_TYPE === 'sqlite' ? 'simple-enum' : 'enum',
    enum: ['pending', 'rewarded', 'expired'],
    default: 'pending',
  })
  status!: 'pending' | 'rewarded' | 'expired';

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimalNumberTransformer,
  })
  rewardAmount!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
