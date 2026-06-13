import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { decimalNumberTransformer } from '../database/decimal-number.transformer';

@Entity('wallets')
@Index(['customerId'], { unique: true, where: '"customerId" IS NOT NULL' })
@Index(['vendorId'], { unique: true, where: '"vendorId" IS NOT NULL' })
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  vendorId?: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: decimalNumberTransformer,
  })
  balance!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
