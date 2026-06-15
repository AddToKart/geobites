import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('reward_points')
@Index(['userId'], { unique: true })
export class RewardPoints {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  userId!: string;

  @Column({ type: 'int', default: 0 })
  balance!: number;

  @Column({ type: 'int', default: 0 })
  lifetimeEarned!: number;

  @Column({ type: 'int', default: 0 })
  lifetimeRedeemed!: number;

  @Column({ type: 'int', default: 0 })
  discountBalance!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
