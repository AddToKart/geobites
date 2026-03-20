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

  @Column({ type: 'uuid' })
  vendorId!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  riderId?: string;

  @Column({
    type: 'enum',
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

  @Column({ type: 'text' })
  deliveryAddress!: string;

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
}
