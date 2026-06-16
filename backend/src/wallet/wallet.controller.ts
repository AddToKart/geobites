import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
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
  @Roles('customer', 'rider')
  async getWallet(@CurrentUser('id') customerId: string) {
    return this.walletService.getOrCreateWallet(customerId);
  }

  @Get('transactions')
  @Roles('customer', 'rider')
  async getTransactions(
    @CurrentUser('id') customerId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walletService.getTransactionHistory(
      customerId,
      Number(page) || 1,
      Number(limit) || 15,
    );
  }

  @Post('cash-in')
  @Roles('customer', 'rider')
  async initiateCashIn(
    @CurrentUser('id') customerId: string,
    @Body('amount') amount: number,
    @Body('paymentMethod') paymentMethod: 'GCASH' | 'MAYA' | 'QRPH',
  ) {
    return this.walletService.initiateCashIn(customerId, amount, paymentMethod);
  }

  @Post('cash-in/:id/simulate-success')
  @Roles('customer', 'rider', 'seller')
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

  @Post('vendor/cash-in')
  @Roles('seller')
  async initiateVendorCashIn(
    @CurrentUser('id') userId: string,
    @Body('amount') amount: number,
    @Body('paymentMethod') paymentMethod: 'GCASH' | 'MAYA' | 'QRPH',
  ) {
    const vendorId = await this.findVendorId(userId);
    if (!vendorId) return { needsSetup: true };
    return this.walletService.initiateVendorCashIn(vendorId, amount, paymentMethod);
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

  @Post('withdraw')
  @Roles('customer', 'rider')
  @HttpCode(HttpStatus.OK)
  async withdrawCustomer(
    @CurrentUser('id') customerId: string,
    @Body('amount') amount: number,
    @Body('accountName') accountName: string,
    @Body('accountNumber') accountNumber: string,
    @Body('accountType') accountType: 'bank' | 'ewallet',
    @Body('accountProvider') accountProvider: string,
  ) {
    return this.walletService.requestCustomerWithdrawal(customerId, amount, {
      accountName,
      accountNumber,
      accountType,
      accountProvider,
    });
  }

  @Get('withdrawals')
  @Roles('customer', 'rider')
  async getCustomerWithdrawals(@CurrentUser('id') customerId: string) {
    return this.walletService.getCustomerWithdrawalHistory(customerId);
  }
}
