import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { SessionGuard } from '../common/guards/session.guard';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { VouchersService } from './vouchers.service';

@Controller('vouchers')
@UseGuards(SessionGuard, RolesGuard)
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Get('vendor')
  getMyVouchers(@CurrentUser('id') userId: string) {
    return this.vouchersService.getMyVouchers(userId);
  }

  @Post('vendor')
  @Roles('seller')
  create(@CurrentUser('id') userId: string, @Body() dto: CreateVoucherDto) {
    return this.vouchersService.create(userId, dto);
  }

  @Put('vendor/:id')
  @Roles('seller')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateVoucherDto>,
  ) {
    return this.vouchersService.update(userId, id, dto);
  }

  @Delete('vendor/:id')
  @Roles('seller')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.vouchersService.remove(userId, id);
  }

  @Get('vendor/:vendorId/active')
  getActiveForVendor(@Param('vendorId') vendorId: string) {
    return this.vouchersService.getActiveForVendor(vendorId);
  }

  @Post('validate')
  validateCode(
    @Body() body: { code: string; vendorId: string; orderAmount: number },
  ) {
    return this.vouchersService.validateCode(
      body.code,
      body.vendorId,
      body.orderAmount,
    );
  }
}
