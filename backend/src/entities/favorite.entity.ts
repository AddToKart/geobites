import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Vendor } from './vendor.entity';

@Entity('favorites')
@Unique(['userId', 'vendorId'])
@Index(['userId'])
@Index(['vendorId'])
export class Favorite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  userId!: string;

  @Column({ type: 'uuid' })
  vendorId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Vendor, (vendor) => vendor.favorites, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vendorId' })
  vendor!: Vendor;
}
