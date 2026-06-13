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
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { WalletService } from './wallet.service';
import { Vendor } from '../entities/vendor.entity';
import { RolesGuard } from '../common/guards/roles.guard';
import { SessionGuard } from '../common/guards/session.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('wallet')
@UseGuards(SessionGuard, RolesGuard)
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
  ) {}

  private async findVendorId(userId: string): Promise<string | null> {
    const vendor = await this.vendorRepository.findOne({ where: { userId } });
    return vendor ? vendor.id : null;
  }

  @Get('balance')
  @Roles('customer')
  async getWallet(@CurrentUser('id') customerId: string) {
    return this.walletService.getOrCreateWallet(customerId);
  }

  @Get('transactions')
  @Roles('customer')
  async getTransactions(@CurrentUser('id') customerId: string) {
    return this.walletService.getTransactionHistory(customerId);
  }

  @Post('cash-in')
  @Roles('customer')
  async initiateCashIn(
    @CurrentUser('id') customerId: string,
    @Body('amount') amount: number,
    @Body('paymentMethod') paymentMethod: 'GCASH' | 'MAYA' | 'QRPH',
  ) {
    return this.walletService.initiateCashIn(customerId, amount, paymentMethod);
  }

  @Post('cash-in/:id/simulate-success')
  @Roles('customer')
  @HttpCode(HttpStatus.OK)
  async simulateSuccess(@Param('id') id: string) {
    return this.walletService.completeCashIn(id);
  }

  @Get('vendor')
  @Roles('seller')
  async getVendorWallet(@CurrentUser('id') userId: string) {
    const vendorId = await this.findVendorId(userId);
    if (!vendorId) return { needsSetup: true };
    return this.walletService.getOrCreateVendorWallet(vendorId);
  }

  @Get('vendor/transactions')
  @Roles('seller')
  async getVendorTransactions(@CurrentUser('id') userId: string) {
    const vendorId = await this.findVendorId(userId);
    if (!vendorId) return { needsSetup: true };
    return this.walletService.getVendorTransactionHistory(vendorId);
  }

  @Post('vendor/withdraw')
  @Roles('seller')
  @HttpCode(HttpStatus.OK)
  async withdraw(
    @CurrentUser('id') userId: string,
    @Body('amount') amount: number,
    @Body('accountName') accountName: string,
    @Body('accountNumber') accountNumber: string,
    @Body('accountType') accountType: 'bank' | 'ewallet',
    @Body('accountProvider') accountProvider: string,
  ) {
    const vendorId = await this.findVendorId(userId);
    if (!vendorId) return { needsSetup: true };
    return this.walletService.requestWithdrawal(vendorId, amount, {
      accountName,
      accountNumber,
      accountType,
      accountProvider,
    });
  }

  @Get('vendor/withdrawals')
  @Roles('seller')
  async getWithdrawals(@CurrentUser('id') userId: string) {
    const vendorId = await this.findVendorId(userId);
    if (!vendorId) return { needsSetup: true };
    return this.walletService.getWithdrawalHistory(vendorId);
  }
}
