import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promotion } from '../entities/promotion.entity';
import { Vendor } from '../entities/vendor.entity';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
  ) {}

  async create(
    createPromotionDto: CreatePromotionDto,
    sellerId: string,
  ): Promise<Promotion> {
    const vendor = await this.vendorRepository.findOne({
      where: { id: createPromotionDto.vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    if (vendor.userId !== sellerId) {
      throw new ForbiddenException('You can only manage your own promotions');
    }

    if (new Date(createPromotionDto.startsAt) < new Date()) {
      throw new BadRequestException('Start date must be in the future');
    }

    if (
      createPromotionDto.expiresAt &&
      new Date(createPromotionDto.expiresAt) <=
        new Date(createPromotionDto.startsAt)
    ) {
      throw new BadRequestException('Expiry must be after start date');
    }

    const promotion = this.promotionRepository.create({
      ...createPromotionDto,
      startsAt: new Date(createPromotionDto.startsAt),
      expiresAt: createPromotionDto.expiresAt
        ? new Date(createPromotionDto.expiresAt)
        : undefined,
    });

    return this.promotionRepository.save(promotion);
  }

  async findByVendor(vendorId: string): Promise<Promotion[]> {
    return this.promotionRepository.find({
      where: { vendorId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    updatePromotionDto: UpdatePromotionDto,
    sellerId: string,
  ): Promise<Promotion> {
    const promotion = await this.promotionRepository.findOne({
      where: { id },
      relations: { vendor: true },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    if (promotion.vendor.userId !== sellerId) {
      throw new ForbiddenException('You can only manage your own promotions');
    }

    if (
      updatePromotionDto.startsAt &&
      new Date(updatePromotionDto.startsAt) < new Date()
    ) {
      throw new BadRequestException('Start date must be in the future');
    }

    Object.assign(promotion, updatePromotionDto);
    return this.promotionRepository.save(promotion);
  }

  async toggleActive(id: string, sellerId: string): Promise<Promotion> {
    const promotion = await this.promotionRepository.findOne({
      where: { id },
      relations: { vendor: true },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    if (promotion.vendor.userId !== sellerId) {
      throw new ForbiddenException('You can only manage your own promotions');
    }

    promotion.isActive = !promotion.isActive;
    return this.promotionRepository.save(promotion);
  }

  async remove(id: string, sellerId: string): Promise<void> {
    const promotion = await this.promotionRepository.findOne({
      where: { id },
      relations: { vendor: true },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    if (promotion.vendor.userId !== sellerId) {
      throw new ForbiddenException('You can only manage your own promotions');
    }

    await this.promotionRepository.remove(promotion);
  }

  async getActivePromotionsForVendor(vendorId: string): Promise<Promotion[]> {
    const now = new Date();
    return this.promotionRepository
      .createQueryBuilder('promotion')
      .where('promotion.vendorId = :vendorId', { vendorId })
      .andWhere('promotion.isActive = :isActive', { isActive: true })
      .andWhere('promotion.startsAt <= :now', { now })
      .andWhere(
        '(promotion.expiresAt IS NULL OR promotion.expiresAt >= :now)',
        { now },
      )
      .andWhere(
        '(promotion.usageLimit IS NULL OR promotion.currentUsage < promotion.usageLimit)',
      )
      .getMany();
  }
}
