import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { decimalNumberTransformer } from '../database/decimal-number.transformer';
import { OrderItem } from './order-item.entity';
import { Rating } from './rating.entity';
import { Vendor } from './vendor.entity';

@Entity('orders')
@Index(['customerId'])
@Index(['vendorId'])
@Index(['riderId'])
@Index(['status'])
@Index(['createdAt'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  customerId!: string;

  @Column({ type: 'varchar', length: 255 })
  vendorId!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  riderId?: string;

  @Column({
    type: process.env.DB_TYPE === 'sqlite' ? 'simple-enum' : 'enum',
    enum: [
      'pending',
      'accepted',
      'preparing',
      'ready_for_pickup',
      'picked_up',
      'delivering',
      'delivered',
      'rejected',
      'cancelled',
    ],
    default: 'pending',
  })
  status!:
    | 'pending'
    | 'accepted'
    | 'preparing'
    | 'ready_for_pickup'
    | 'picked_up'
    | 'delivering'
    | 'delivered'
    | 'rejected'
    | 'cancelled';

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalNumberTransformer,
  })
  totalAmount!: number;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    default: 0,
    transformer: decimalNumberTransformer,
  })
  deliveryFee!: number;

  @Column({ type: 'text', nullable: true })
  street?: string;

  @Column({ type: 'text', nullable: true })
  barangay?: string;

  @Column({ type: 'text', nullable: true })
  landmark?: string;

  @Column({ type: 'text', nullable: true })
  floorOrGate?: string;

  @Column({
    type: process.env.DB_TYPE === 'sqlite' ? 'simple-enum' : 'enum',
    enum: ['COD', 'GCASH', 'MAYA', 'QRPH', 'GEOPAY'],
    default: 'COD',
  })
  paymentMethod!: 'COD' | 'GCASH' | 'MAYA' | 'QRPH' | 'GEOPAY';

  @Column({
    type: process.env.DB_TYPE === 'sqlite' ? 'simple-enum' : 'enum',
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  })
  paymentStatus!: 'pending' | 'paid' | 'failed';

  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentSessionId?: string;

  @Column({ type: 'text', nullable: true })
  cancellationReason?: string;

  @Column({ type: 'text', nullable: true })
  disputeReason?: string;

  @Column({
    type: process.env.DB_TYPE === 'sqlite' ? 'simple-enum' : 'enum',
    enum: ['none', 'open', 'resolved_refunded', 'resolved_rejected'],
    default: 'none',
  })
  disputeStatus!: 'none' | 'open' | 'resolved_refunded' | 'resolved_rejected';

  @Column({
    type: process.env.DB_TYPE === 'sqlite' ? 'datetime' : 'timestamp',
    nullable: true,
  })
  estimatedDeliveryTime?: Date;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 8,
    nullable: true,
    transformer: decimalNumberTransformer,
  })
  deliveryLat?: number;

  @Column({
    type: 'decimal',
    precision: 11,
    scale: 8,
    nullable: true,
    transformer: decimalNumberTransformer,
  })
  deliveryLng?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimalNumberTransformer,
  })
  discountAmount!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  discountLabel?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Vendor, (vendor) => vendor.orders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vendorId' })
  vendor!: Vendor;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
    cascade: true,
  })
  items!: OrderItem[];

  @OneToMany(() => Rating, (rating) => rating.order)
  ratings!: Rating[];

  riderName?: string;
  riderPhone?: string;
  customerName?: string;
  customerPhone?: string;
  vendorPhone?: string;
}
