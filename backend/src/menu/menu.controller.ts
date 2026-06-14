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
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuService } from './menu.service';

@Controller()
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('vendors/:vendorId/menu')
  findVendorMenu(@Param('vendorId') vendorId: string) {
    return this.menuService.findVendorMenu(vendorId);
  }

  @Get('menu/search')
  searchMenu(
    @Query('q') query: string,
    @Query('category') category?: string,
    @Query('priceMin') priceMin?: string,
    @Query('priceMax') priceMax?: string,
  ) {
    if (!query || query.trim().length === 0) {
      return [];
    }
    return this.menuService.searchAcrossVendors(query.trim(), {
      category,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
    });
  }

  @Post('menu')
  @UseGuards(SessionGuard, RolesGuard)
  @Roles('seller')
  create(
    @Body() createMenuItemDto: CreateMenuItemDto,
    @CurrentUser('id') sellerId: string,
  ) {
    return this.menuService.create(createMenuItemDto, sellerId);
  }

  @Put('menu/:id')
  @UseGuards(SessionGuard, RolesGuard)
  @Roles('seller')
  update(
    @Param('id') id: string,
    @Body() updateMenuItemDto: UpdateMenuItemDto,
    @CurrentUser('id') sellerId: string,
  ) {
    return this.menuService.update(id, updateMenuItemDto, sellerId);
  }

  @Delete('menu/:id')
  @UseGuards(SessionGuard, RolesGuard)
  @Roles('seller')
  remove(@Param('id') id: string, @CurrentUser('id') sellerId: string) {
    return this.menuService.remove(id, sellerId);
  }
}
