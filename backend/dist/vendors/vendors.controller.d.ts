import { CreateVendorDto } from './dto/create-vendor.dto';
import { QueryVendorsDto } from './dto/query-vendors.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorsService } from './vendors.service';
export declare class VendorsController {
    private readonly vendorsService;
    constructor(vendorsService: VendorsService);
    findAll(query: QueryVendorsDto): Promise<{
        data: import("../entities/vendor.entity").Vendor[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<import("../entities/vendor.entity").Vendor>;
    create(createVendorDto: CreateVendorDto, userId: string): Promise<import("../entities/vendor.entity").Vendor>;
    update(id: string, updateVendorDto: UpdateVendorDto, userId: string): Promise<import("../entities/vendor.entity").Vendor>;
}
