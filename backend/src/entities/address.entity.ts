import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { decimalNumberTransformer } from '../database/decimal-number.transformer';

@Entity('addresses')
@Index(['userId'])
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  userId!: string;

  @Column({ type: 'varchar', length: 100 })
  label!: string;

  @Column({ type: 'text', nullable: true })
  street?: string;

  @Column({ type: 'text', nullable: true })
  barangay?: string;

  @Column({ type: 'text', nullable: true })
  landmark?: string;

  @Column({ type: 'text', nullable: true })
  floorOrGate?: string;

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

  @Column({ type: 'boolean', default: false })
  isDefault!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
