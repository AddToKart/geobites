import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { SessionGuard } from '../common/guards/session.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('wallet')
@UseGuards(SessionGuard, RolesGuard)
@Roles('customer')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  async getWallet(@CurrentUser('id') customerId: string) {
    return this.walletService.getOrCreateWallet(customerId);
  }

  @Get('transactions')
  async getTransactions(@CurrentUser('id') customerId: string) {
    return this.walletService.getTransactionHistory(customerId);
  }

  @Post('cash-in')
  async initiateCashIn(
    @CurrentUser('id') customerId: string,
    @Body('amount') amount: number,
    @Body('paymentMethod') paymentMethod: 'GCASH' | 'MAYA' | 'QRPH',
  ) {
    return this.walletService.initiateCashIn(customerId, amount, paymentMethod);
  }

  @Post('cash-in/:id/simulate-success')
  @HttpCode(HttpStatus.OK)
  async simulateSuccess(@Param('id') id: string) {
    return this.walletService.completeCashIn(id);
  }
}
