import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('rider_ratings')
@Index(['riderId'])
@Index(['raterId'])
@Index(['orderId', 'raterRole'], { unique: true })
export class RiderRating {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  orderId!: string;

  @Column({ type: 'varchar', length: 255 })
  raterId!: string;

  @Column({ type: 'varchar', length: 50 })
  raterRole!: 'customer' | 'seller';

  @Column({ type: 'varchar', length: 255 })
  riderId!: string;

  @Column({ type: 'int' })
  score!: number;

  @Column({ type: 'text', nullable: true })
  feedback?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Order, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  order!: Order;
}
