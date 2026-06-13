import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { decimalNumberTransformer } from '../database/decimal-number.transformer';
import { MenuItem } from './menu-item.entity';
import { Order } from './order.entity';
import { Promotion } from './promotion.entity';
import { Rating } from './rating.entity';

@Entity('vendors')
@Index(['userId'], { unique: true })
@Index(['latitude', 'longitude'])
@Index(['rating'])
export class Vendor {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  userId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text' })
  address!: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 8,
    transformer: decimalNumberTransformer,
  })
  latitude!: number;

  @Column({
    type: 'decimal',
    precision: 11,
    scale: 8,
    transformer: decimalNumberTransformer,
  })
  longitude!: number;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0,
    transformer: decimalNumberTransformer,
  })
  rating!: number;

  @Column({ type: 'int', default: 0 })
  totalRatings!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl?: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => MenuItem, (menuItem) => menuItem.vendor)
  menuItems!: MenuItem[];

  @OneToMany(() => Order, (order) => order.vendor)
  orders!: Order[];

  @OneToMany(() => Rating, (rating) => rating.vendor)
  ratings!: Rating[];

  @OneToMany(() => Promotion, (promotion) => promotion.vendor)
  promotions!: Promotion[];
}
