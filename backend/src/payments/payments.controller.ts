import {
  Controller,
  Param,
  Post,
  Get,
  Body,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { SessionGuard } from '../common/guards/session.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':orderId/pay')
  @UseGuards(SessionGuard, RolesGuard)
  @Roles('customer')
  async payOnline(
    @Param('orderId') orderId: string,
    @CurrentUser('id') customerId: string,
  ) {
    return this.paymentsService.processPayment(orderId, customerId);
  }

  @Get(':orderId/status')
  @UseGuards(SessionGuard, RolesGuard)
  @Roles('customer')
  async getPaymentStatus(
    @Param('orderId') orderId: string,
    @CurrentUser('id') customerId: string,
  ) {
    return this.paymentsService.verifySessionStatus(orderId, customerId);
  }

  @Post(':orderId/cod-collect')
  @UseGuards(SessionGuard, RolesGuard)
  @Roles('rider')
  async collectCod(
    @Param('orderId') orderId: string,
    @CurrentUser('id') riderId: string,
  ) {
    return this.paymentsService.markCodAsPaid(orderId, riderId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() body: any,
    @Headers('paymongo-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(body, signature);
  }

  @Post(':orderId/simulate-success')
  @HttpCode(HttpStatus.OK)
  async simulateSuccess(@Param('orderId') orderId: string) {
    return this.paymentsService.simulateLocalPaymentSuccess(orderId);
  }

  @Post(':orderId/verify-manual')
  @UseGuards(SessionGuard, RolesGuard)
  @Roles('seller')
  @HttpCode(HttpStatus.OK)
  async verifyManual(
    @Param('orderId') orderId: string,
    @CurrentUser('id') sellerId: string,
  ) {
    return this.paymentsService.verifyManualPayment(orderId, sellerId);
  }
}
