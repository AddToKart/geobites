export declare class CreateVendorDto {
    name: string;
    description?: string;
    address: string;
    latitude: number;
    longitude: number;
    imageUrl?: string;
    isActive?: boolean;
    isTemporarilyClosed?: boolean;
    operatingHours?: Array<{
        dayOfWeek: number;
        openTime: string;
        closeTime: string;
        isClosed: boolean;
    }>;
    commissionRate?: number;
}
