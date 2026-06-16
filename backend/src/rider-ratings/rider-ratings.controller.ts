import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { SessionGuard } from '../common/guards/session.guard';
import { CreateRiderRatingDto } from './dto/create-rider-rating.dto';
import { RiderRatingsService } from './rider-ratings.service';

@Controller('rider-ratings')
export class RiderRatingsController {
  constructor(private readonly riderRatingsService: RiderRatingsService) {}

  @Post()
  @UseGuards(SessionGuard, RolesGuard)
  @Roles('customer', 'seller')
  create(
    @Body() dto: CreateRiderRatingDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: 'customer' | 'seller',
  ) {
    return this.riderRatingsService.create(dto, userId, role);
  }
}
