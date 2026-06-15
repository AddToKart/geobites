import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuItem } from '../entities/menu-item.entity';
import { Vendor } from '../entities/vendor.entity';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuItem)
    private readonly menuRepository: Repository<MenuItem>,
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
  ) {}

  async findVendorMenu(vendorId: string) {
    return this.menuRepository.find({
      where: { vendorId },
      order: { name: 'ASC' },
    });
  }

  async searchAcrossVendors(
    query: string,
    filters?: { category?: string; priceMin?: number; priceMax?: number },
  ) {
    const qb = this.menuRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.vendor', 'vendor')
      .where('item.isAvailable = :available', { available: true })
      .andWhere(
        '(LOWER(item.name) LIKE LOWER(:query) OR LOWER(item.description) LIKE LOWER(:query))',
        { query: `%${query}%` },
      );

    if (filters?.category) {
      qb.andWhere('LOWER(item.category) = LOWER(:category)', {
        category: filters.category,
      });
    }
    if (filters?.priceMin !== undefined) {
      qb.andWhere('item.price >= :priceMin', { priceMin: filters.priceMin });
    }
    if (filters?.priceMax !== undefined) {
      qb.andWhere('item.price <= :priceMax', { priceMax: filters.priceMax });
    }

    qb.orderBy('item.name', 'ASC');

    const items = await qb.getMany();

    // Group by vendor
    const grouped: Record<
      string,
      {
        vendor: {
          id: string;
          name: string;
          imageUrl?: string;
          rating: number;
          totalRatings: number;
        };
        items: typeof items;
      }
    > = {};

    for (const item of items) {
      if (!item.vendor) continue;
      const vid = item.vendor.id;
      if (!grouped[vid]) {
        grouped[vid] = {
          vendor: {
            id: item.vendor.id,
            name: item.vendor.name,
            imageUrl: item.vendor.imageUrl,
            rating: item.vendor.rating,
            totalRatings: item.vendor.totalRatings,
          },
          items: [],
        };
      }
      const { vendor: _v, ...itemData } = item;
      grouped[vid].items.push(itemData as any);
    }

    return Object.values(grouped);
  }

  async create(createMenuItemDto: CreateMenuItemDto, sellerId: string) {
    const vendor = await this.vendorRepository.findOne({
      where: {
        id: createMenuItemDto.vendorId,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    if (vendor.userId !== sellerId) {
      throw new ForbiddenException('You can only manage your own menu');
    }

    const menuItem = this.menuRepository.create({
      ...createMenuItemDto,
      isAvailable: createMenuItemDto.isAvailable ?? true,
    });

    return this.menuRepository.save(menuItem);
  }

  async update(
    id: string,
    updateMenuItemDto: UpdateMenuItemDto,
    sellerId: string,
  ) {
    const menuItem = await this.menuRepository.findOne({
      where: { id },
      relations: {
        vendor: true,
      },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    if (menuItem.vendor.userId !== sellerId) {
      throw new ForbiddenException('You can only manage your own menu');
    }

    Object.assign(menuItem, updateMenuItemDto);
    return this.menuRepository.save(menuItem);
  }

  async remove(id: string, sellerId: string) {
    const menuItem = await this.menuRepository.findOne({
      where: { id },
      relations: {
        vendor: true,
      },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    if (menuItem.vendor.userId !== sellerId) {
      throw new ForbiddenException('You can only manage your own menu');
    }

    await this.menuRepository.remove(menuItem);

    return {
      success: true,
    };
  }
}
