import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Put('location')
  @UseGuards(RolesGuard)
  @Roles('rider')
  async updateLocation(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateLocationDto,
  ) {
    return this.trackingService.updateLocation(user.id, dto);
  }

  @Get('order/:orderId')
  @UseGuards(RolesGuard)
  @Roles('customer', 'seller', 'rider')
  async getOrderLocation(@Param('orderId') orderId: string) {
    return this.trackingService.getLocationByOrderId(orderId);
  }
}
