import {
  Column,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { decimalNumberTransformer } from '../database/decimal-number.transformer';

@Entity('rider_locations')
export class RiderLocation {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  riderId!: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 8,
    transformer: decimalNumberTransformer,
  })
  lat!: number;

  @Column({
    type: 'decimal',
    precision: 11,
    scale: 8,
    transformer: decimalNumberTransformer,
  })
  lng!: number;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  orderId?: string | null;

  @UpdateDateColumn()
  updatedAt!: Date;
}
