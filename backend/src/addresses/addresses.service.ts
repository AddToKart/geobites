import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from '../entities/address.entity';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  async findAll(userId: string): Promise<Address[]> {
    return this.addressRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Address> {
    const address = await this.addressRepository.findOne({ where: { id } });
    if (!address) throw new NotFoundException('Address not found');
    if (address.userId !== userId) throw new ForbiddenException('Not your address');
    return address;
  }

  async create(
    userId: string,
    data: {
      label: string;
      street?: string;
      barangay?: string;
      landmark?: string;
      floorOrGate?: string;
      deliveryLat?: number;
      deliveryLng?: number;
      isDefault?: boolean;
    },
  ): Promise<Address> {
    if (data.isDefault) {
      await this.addressRepository.update({ userId, isDefault: true }, { isDefault: false });
    }
    const address = this.addressRepository.create({ userId, ...data });
    return this.addressRepository.save(address);
  }

  async update(
    id: string,
    userId: string,
    data: Partial<{
      label: string;
      street: string;
      barangay: string;
      landmark: string;
      floorOrGate: string;
      deliveryLat: number;
      deliveryLng: number;
      isDefault: boolean;
    }>,
  ): Promise<Address> {
    const address = await this.findOne(id, userId);
    if (data.isDefault) {
      await this.addressRepository.update({ userId, isDefault: true }, { isDefault: false });
    }
    Object.assign(address, data);
    return this.addressRepository.save(address);
  }

  async remove(id: string, userId: string): Promise<void> {
    const address = await this.findOne(id, userId);
    await this.addressRepository.remove(address);
  }
}
