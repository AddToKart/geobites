import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { SessionGuard } from '../common/guards/session.guard';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { QueryVendorsDto } from './dto/query-vendors.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorsService } from './vendors.service';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  findAll(@Query() query: QueryVendorsDto) {
    return this.vendorsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vendorsService.findOne(id);
  }

  @Post()
  @UseGuards(SessionGuard, RolesGuard)
  @Roles('seller')
  create(
    @Body() createVendorDto: CreateVendorDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.vendorsService.create(createVendorDto, userId);
  }

  @Put(':id')
  @UseGuards(SessionGuard, RolesGuard)
  @Roles('seller')
  update(
    @Param('id') id: string,
    @Body() updateVendorDto: UpdateVendorDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.vendorsService.update(id, updateVendorDto, userId);
  }

  @Delete(':id')
  @UseGuards(SessionGuard, RolesGuard)
  @Roles('seller')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.vendorsService.remove(id, userId);
  }
}
