import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { SessionGuard } from '../common/guards/session.guard';
import { QueryRiderDeliveriesDto } from './dto/query-rider-deliveries.dto';
import { UpdateRiderLocationDto } from './dto/update-rider-location.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { RidersService } from './riders.service';

@Controller('riders')
@UseGuards(SessionGuard, RolesGuard)
@Roles('rider')
export class RidersController {
  constructor(private readonly ridersService: RidersService) {}

  @Get('deliveries')
  findDeliveries(
    @CurrentUser('id') riderId: string,
    @Query() query: QueryRiderDeliveriesDto,
  ) {
    return this.ridersService.findDeliveries(riderId, query);
  }

  @Patch('deliveries/:orderId/accept')
  acceptDelivery(
    @Param('orderId') orderId: string,
    @CurrentUser('id') riderId: string,
  ) {
    return this.ridersService.acceptDelivery(orderId, riderId);
  }

  @Patch('deliveries/:orderId/status')
  updateStatus(
    @Param('orderId') orderId: string,
    @CurrentUser('id') riderId: string,
    @Body() updateStatusDto: UpdateDeliveryStatusDto,
  ) {
    return this.ridersService.updateDeliveryStatus(
      orderId,
      riderId,
      updateStatusDto,
    );
  }

  @Patch('deliveries/:orderId/location')
  updateLocation(
    @Param('orderId') orderId: string,
    @CurrentUser('id') riderId: string,
    @Body() updateLocationDto: UpdateRiderLocationDto,
  ) {
    return this.ridersService.updateRiderLocation(
      orderId,
      riderId,
      updateLocationDto,
    );
  }
}
