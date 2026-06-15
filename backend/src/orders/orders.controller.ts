import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { SessionGuard } from '../common/guards/session.guard';
import { CreateOrderDto, CreatePosOrderDto } from './dto/create-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(SessionGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles('customer')
  create(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordersService.create(createOrderDto, userId);
  }

  @Post('pos')
  @Roles('seller')
  createPos(
    @Body() createPosDto: CreatePosOrderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordersService.createPosOrder(createPosDto, userId);
  }

  @Get()
  @Roles('customer', 'seller', 'rider')
  async findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Query() query: QueryOrdersDto,
  ) {
    try {
      return await this.ordersService.findAllForUser(
        userId,
        role as 'customer' | 'seller' | 'rider',
        query,
      );
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.ordersService.findOneForUser(
      id,
      userId,
      role as 'customer' | 'seller' | 'rider',
    );
  }

  @Patch(':id/status')
  @Roles('customer', 'seller', 'rider')
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.ordersService.updateStatus(
      id,
      updateStatusDto,
      userId,
      role as 'customer' | 'seller' | 'rider',
    );
  }
}
