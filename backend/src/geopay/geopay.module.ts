import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardPoints } from '../entities/reward-points.entity';
import { RewardTransaction } from '../entities/reward-transaction.entity';
import { Referral } from '../entities/referral.entity';
import { GeopayController } from './geopay.controller';
import { GeopayService } from './geopay.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RewardPoints, RewardTransaction, Referral]),
  ],
  controllers: [GeopayController],
  providers: [GeopayService],
  exports: [GeopayService],
})
export class GeopayModule {}
