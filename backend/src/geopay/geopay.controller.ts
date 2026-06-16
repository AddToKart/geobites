import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { SessionGuard } from '../common/guards/session.guard';
import { GeopayService } from './geopay.service';

@Controller('geopay')
@UseGuards(SessionGuard, RolesGuard)
export class GeopayController {
  constructor(private readonly geopayService: GeopayService) {}

  @Get('rewards/balance')
  getRewardsBalance(@CurrentUser('id') userId: string) {
    return this.geopayService.getRewardsBalance(userId);
  }

  @Get('rewards/history')
  getRewardHistory(@CurrentUser('id') userId: string) {
    return this.geopayService.getRewardHistory(userId);
  }

  @Post('rewards/redeem')
  redeemPoints(
    @CurrentUser('id') userId: string,
    @Body() body: { points: number },
  ) {
    return this.geopayService.redeemPoints(userId, body.points);
  }

  @Post('rewards/consume-discount')
  consumeDiscount(
    @CurrentUser('id') userId: string,
    @Body() body: { discountPesos: number },
  ) {
    return this.geopayService.consumeDiscount(userId, body.discountPesos);
  }

  @Get('referral/code')
  getReferralCode(@CurrentUser('id') userId: string) {
    return this.geopayService.getReferralCode(userId);
  }

  @Post('referral/register')
  registerReferral(
    @CurrentUser('id') userId: string,
    @Body() body: { code: string; email?: string },
  ) {
    return this.geopayService.registerReferral(body.code, userId, body.email);
  }

  @Get('referral/history')
  getReferralHistory(@CurrentUser('id') userId: string) {
    return this.geopayService.getReferralHistory(userId);
  }
}
