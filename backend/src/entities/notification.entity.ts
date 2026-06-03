import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('notifications')
@Index(['userId'])
@Index(['isRead'])
@Index(['createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  userId!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({
    type: process.env.USE_MEMORY_DB === 'true' ? 'simple-enum' : 'enum',
    enum: ['order_update', 'delivery_request', 'rating', 'system'],
  })
  type!: 'order_update' | 'delivery_request' | 'rating' | 'system';

  @Column({ type: 'uuid', nullable: true })
  referenceId?: string;

  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
