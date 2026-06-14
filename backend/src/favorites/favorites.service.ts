import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from '../entities/favorite.entity';
import { Vendor } from '../entities/vendor.entity';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepository: Repository<Favorite>,
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
  ) {}

  async add(userId: string, dto: CreateFavoriteDto): Promise<Favorite> {
    const vendor = await this.vendorRepository.findOne({
      where: { id: dto.vendorId },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const existing = await this.favoriteRepository.findOne({
      where: { userId, vendorId: dto.vendorId },
    });
    if (existing) {
      throw new ConflictException('Vendor is already in favorites');
    }

    const favorite = this.favoriteRepository.create({
      userId,
      vendorId: dto.vendorId,
    });
    return this.favoriteRepository.save(favorite);
  }

  async remove(userId: string, vendorId: string): Promise<void> {
    const favorite = await this.favoriteRepository.findOne({
      where: { userId, vendorId },
    });
    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }
    await this.favoriteRepository.remove(favorite);
  }

  async findAll(userId: string) {
    const favorites = await this.favoriteRepository.find({
      where: { userId },
      relations: { vendor: true },
      order: { createdAt: 'DESC' },
    });
    return favorites.map((f) => ({
      id: f.id,
      vendorId: f.vendorId,
      createdAt: f.createdAt,
      vendor: f.vendor,
    }));
  }

  async isFavorite(userId: string, vendorId: string): Promise<boolean> {
    const count = await this.favoriteRepository.count({
      where: { userId, vendorId },
    });
    return count > 0;
  }
}
