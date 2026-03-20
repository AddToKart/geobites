import { Repository } from 'typeorm';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { QueryVendorsDto } from './dto/query-vendors.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { Vendor } from '../entities/vendor.entity';
export declare class VendorsService {
    private readonly vendorRepository;
    constructor(vendorRepository: Repository<Vendor>);
    findAll(query: QueryVendorsDto): Promise<{
        data: Vendor[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<Vendor>;
    create(createVendorDto: CreateVendorDto, ownerUserId: string): Promise<Vendor>;
    update(id: string, updateVendorDto: UpdateVendorDto, ownerUserId: string): Promise<Vendor>;
}
