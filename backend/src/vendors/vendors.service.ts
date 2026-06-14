import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { QueryVendorsDto } from './dto/query-vendors.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { Vendor } from '../entities/vendor.entity';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
  ) {}

  async findAll(query: QueryVendorsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.vendorRepository.createQueryBuilder('vendor');

    if (query.search) {
      qb.where(
        '(LOWER(vendor.name) LIKE LOWER(:search) OR LOWER(vendor.description) LIKE LOWER(:search))',
        { search: `%${query.search}%` },
      );
    }

    const sortBy = query.sortBy ?? 'rating';
    const hasCoordinates = query.lat !== undefined && query.lng !== undefined;
    if (sortBy === 'distance' && hasCoordinates) {
      qb.orderBy(
        '((vendor.latitude - :lat) * (vendor.latitude - :lat) + (vendor.longitude - :lng) * (vendor.longitude - :lng))',
        'ASC',
      )
        .addOrderBy('vendor.rating', 'DESC')
        .addOrderBy('vendor.name', 'ASC')
        .setParameters({
          lat: query.lat,
          lng: query.lng,
        });
    } else if (sortBy === 'name') {
      qb.orderBy('vendor.name', 'ASC');
    } else {
      qb.orderBy('vendor.rating', 'DESC');
    }

    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Vendor> {
    const vendor = await this.vendorRepository.findOne({
      where: { id },
      relations: {
        menuItems: true,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  async create(
    createVendorDto: CreateVendorDto,
    ownerUserId: string,
  ): Promise<Vendor> {
    const existingVendor = await this.vendorRepository.findOne({
      where: { userId: ownerUserId },
    });

    if (existingVendor) {
      throw new ForbiddenException('Seller already has a vendor profile');
    }

    const vendor = this.vendorRepository.create({
      ...createVendorDto,
      userId: ownerUserId,
    });

    return this.vendorRepository.save(vendor);
  }

  async update(
    id: string,
    updateVendorDto: UpdateVendorDto,
    ownerUserId: string,
  ): Promise<Vendor> {
    const vendor = await this.vendorRepository.findOne({
      where: { id },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    if (vendor.userId !== ownerUserId) {
      throw new ForbiddenException('You can only update your own vendor');
    }

    Object.assign(vendor, updateVendorDto);
    return this.vendorRepository.save(vendor);
  }
}
