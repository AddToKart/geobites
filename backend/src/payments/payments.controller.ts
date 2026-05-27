import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('payments')
@UseGuards(RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':orderId/pay')
  @Roles('customer')
  async payOnline(
    @Param('orderId') orderId: string,
    @CurrentUser('id') customerId: string,
  ) {
    return this.paymentsService.processPayment(orderId, customerId);
  }

  @Post(':orderId/cod-collect')
  @Roles('rider')
  async collectCod(
    @Param('orderId') orderId: string,
    @CurrentUser('id') riderId: string,
  ) {
    return this.paymentsService.markCodAsPaid(orderId, riderId);
  }
}
