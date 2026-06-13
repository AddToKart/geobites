import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PayMongoProvider } from './paymongo.provider';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), WalletModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PayMongoProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
