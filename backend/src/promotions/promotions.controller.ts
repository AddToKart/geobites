import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { SessionGuard } from '../common/guards/session.guard';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { PromotionsService } from './promotions.service';

@Controller()
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post('promotions')
  @UseGuards(SessionGuard, RolesGuard)
  @Roles('seller')
  create(
    @Body() createPromotionDto: CreatePromotionDto,
    @CurrentUser('id') sellerId: string,
  ) {
    return this.promotionsService.create(createPromotionDto, sellerId);
  }

  @Get('vendors/:vendorId/promotions')
  findByVendor(@Param('vendorId') vendorId: string) {
    return this.promotionsService.findByVendor(vendorId);
  }

  @Get('vendors/:vendorId/promotions/active')
  findActiveByVendor(@Param('vendorId') vendorId: string) {
    return this.promotionsService.getActivePromotionsForVendor(vendorId);
  }

  @Patch('promotions/:id')
  @UseGuards(SessionGuard, RolesGuard)
  @Roles('seller')
  update(
    @Param('id') id: string,
    @Body() updatePromotionDto: UpdatePromotionDto,
    @CurrentUser('id') sellerId: string,
  ) {
    return this.promotionsService.update(id, updatePromotionDto, sellerId);
  }

  @Patch('promotions/:id/toggle')
  @UseGuards(SessionGuard, RolesGuard)
  @Roles('seller')
  toggleActive(
    @Param('id') id: string,
    @CurrentUser('id') sellerId: string,
  ) {
    return this.promotionsService.toggleActive(id, sellerId);
  }

  @Delete('promotions/:id')
  @UseGuards(SessionGuard, RolesGuard)
  @Roles('seller')
  remove(
    @Param('id') id: string,
    @CurrentUser('id') sellerId: string,
  ) {
    return this.promotionsService.remove(id, sellerId);
  }
}
