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
import { AddressesService } from './addresses.service';

@Controller('addresses')
@UseGuards(SessionGuard, RolesGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  @Roles('customer', 'seller', 'rider')
  findAll(@CurrentUser('id') userId: string) {
    return this.addressesService.findAll(userId);
  }

  @Get(':id')
  @Roles('customer', 'seller', 'rider')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.addressesService.findOne(id, userId);
  }

  @Post()
  @Roles('customer', 'seller', 'rider')
  create(
    @Body()
    body: {
      label: string;
      street?: string;
      barangay?: string;
      landmark?: string;
      floorOrGate?: string;
      deliveryLat?: number;
      deliveryLng?: number;
      isDefault?: boolean;
    },
    @CurrentUser('id') userId: string,
  ) {
    return this.addressesService.create(userId, body);
  }

  @Patch(':id')
  @Roles('customer', 'seller', 'rider')
  update(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      label: string;
      street: string;
      barangay: string;
      landmark: string;
      floorOrGate: string;
      deliveryLat: number;
      deliveryLng: number;
      isDefault: boolean;
    }>,
    @CurrentUser('id') userId: string,
  ) {
    return this.addressesService.update(id, userId, body);
  }

  @Delete(':id')
  @Roles('customer', 'seller', 'rider')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.addressesService.remove(id, userId);
  }
}
