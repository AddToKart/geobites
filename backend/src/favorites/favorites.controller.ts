import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { SessionGuard } from '../common/guards/session.guard';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { FavoritesService } from './favorites.service';

@Controller('favorites')
@UseGuards(SessionGuard, RolesGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  add(
    @CurrentUser('id') userId: string,
    @Body() createFavoriteDto: CreateFavoriteDto,
  ) {
    return this.favoritesService.add(userId, createFavoriteDto);
  }

  @Delete(':vendorId')
  remove(
    @CurrentUser('id') userId: string,
    @Param('vendorId') vendorId: string,
  ) {
    return this.favoritesService.remove(userId, vendorId);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.favoritesService.findAll(userId);
  }

  @Get('check/:vendorId')
  isFavorite(
    @CurrentUser('id') userId: string,
    @Param('vendorId') vendorId: string,
  ) {
    return this.favoritesService.isFavorite(userId, vendorId);
  }
}
