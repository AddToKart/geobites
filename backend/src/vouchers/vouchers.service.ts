import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Voucher } from '../entities/voucher.entity';
import { Vendor } from '../entities/vendor.entity';
import { CreateVoucherDto } from './dto/create-voucher.dto';

@Injectable()
export class VouchersService {
  constructor(
    @InjectRepository(Voucher)
    private readonly voucherRepository: Repository<Voucher>,
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
  ) {}

  private async getVendorId(userId: string): Promise<string> {
    const vendor = await this.vendorRepository.findOne({ where: { userId } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor.id;
  }

  async getMyVouchers(userId: string) {
    const vendorId = await this.getVendorId(userId);
    return this.voucherRepository.find({
      where: { vendorId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(userId: string, dto: CreateVoucherDto) {
    const vendorId = await this.getVendorId(userId);

    const existing = await this.voucherRepository.findOne({
      where: { code: dto.code },
    });
    if (existing) {
      throw new BadRequestException('Voucher code already exists');
    }

    const voucher = this.voucherRepository.create({
      vendorId,
      code: dto.code.toUpperCase(),
      title: dto.title,
      description: dto.description,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      minOrderAmount: dto.minOrderAmount ?? 0,
      maxUses: dto.maxUses,
      startsAt: new Date(dto.startsAt),
      expiresAt: new Date(dto.expiresAt),
      isActive: dto.isActive ?? true,
    });

    return this.voucherRepository.save(voucher);
  }

  async update(userId: string, id: string, dto: Partial<CreateVoucherDto>) {
    const vendorId = await this.getVendorId(userId);
    const voucher = await this.voucherRepository.findOne({
      where: { id, vendorId },
    });
    if (!voucher) throw new NotFoundException('Voucher not found');

    if (dto.code) voucher.code = dto.code.toUpperCase();
    if (dto.title !== undefined) voucher.title = dto.title;
    if (dto.description !== undefined) voucher.description = dto.description;
    if (dto.discountType) voucher.discountType = dto.discountType;
    if (dto.discountValue !== undefined)
      voucher.discountValue = dto.discountValue;
    if (dto.minOrderAmount !== undefined)
      voucher.minOrderAmount = dto.minOrderAmount;
    if (dto.maxUses !== undefined) voucher.maxUses = dto.maxUses;
    if (dto.startsAt) voucher.startsAt = new Date(dto.startsAt);
    if (dto.expiresAt) voucher.expiresAt = new Date(dto.expiresAt);
    if (dto.isActive !== undefined) voucher.isActive = dto.isActive;

    return this.voucherRepository.save(voucher);
  }

  async remove(userId: string, id: string) {
    const vendorId = await this.getVendorId(userId);
    const result = await this.voucherRepository.delete({ id, vendorId });
    if (result.affected === 0) throw new NotFoundException('Voucher not found');
    return { success: true };
  }

  async getActiveForVendor(vendorId: string) {
    const now = new Date();
    return this.voucherRepository
      .createQueryBuilder('v')
      .where('v.vendorId = :vendorId', { vendorId })
      .andWhere('v.isActive = :active', { active: true })
      .andWhere('v.startsAt <= :now', { now })
      .andWhere('v.expiresAt >= :now', { now })
      .andWhere('v.maxUses IS NULL OR v.currentUses < v.maxUses')
      .orderBy('v.createdAt', 'DESC')
      .getMany();
  }

  async validateCode(code: string, vendorId: string, orderAmount: number) {
    const voucher = await this.voucherRepository.findOne({
      where: { code: code.toUpperCase(), vendorId },
    });
    if (!voucher) throw new NotFoundException('Invalid voucher code');

    const now = new Date();
    if (!voucher.isActive) throw new BadRequestException('Voucher is inactive');
    if (now < voucher.startsAt)
      throw new BadRequestException('Voucher is not yet active');
    if (now > voucher.expiresAt)
      throw new BadRequestException('Voucher has expired');
    if (voucher.maxUses && voucher.currentUses >= voucher.maxUses) {
      throw new BadRequestException('Voucher has reached max uses');
    }
    if (orderAmount < voucher.minOrderAmount) {
      throw new BadRequestException(
        `Minimum order amount is ₱${voucher.minOrderAmount.toFixed(2)}`,
      );
    }

    const discountAmount =
      voucher.discountType === 'fixed'
        ? Math.min(voucher.discountValue, orderAmount)
        : Math.round(((orderAmount * voucher.discountValue) / 100) * 100) / 100;

    return {
      valid: true,
      voucher,
      discountAmount,
    };
  }

  async applyVoucher(code: string, vendorId: string, orderAmount: number) {
    const { voucher, discountAmount } = await this.validateCode(
      code,
      vendorId,
      orderAmount,
    );
    voucher.currentUses += 1;
    await this.voucherRepository.save(voucher);
    return discountAmount;
  }
}
