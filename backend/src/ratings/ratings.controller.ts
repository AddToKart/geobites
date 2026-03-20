import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { SessionGuard } from '../common/guards/session.guard';
import { CreateRatingDto } from './dto/create-rating.dto';
import { RatingsService } from './ratings.service';

@Controller()
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post('ratings')
  @UseGuards(SessionGuard, RolesGuard)
  @Roles('customer')
  create(
    @Body() createRatingDto: CreateRatingDto,
    @CurrentUser('id') customerId: string,
  ) {
    return this.ratingsService.create(createRatingDto, customerId);
  }

  @Get('vendors/:id/ratings')
  findVendorRatings(@Param('id') vendorId: string) {
    return this.ratingsService.findByVendor(vendorId);
  }
}
