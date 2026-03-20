export declare class QueryVendorsDto {
    search?: string;
    lat?: number;
    lng?: number;
    sortBy?: 'rating' | 'distance' | 'name';
    page?: number;
    limit?: number;
}
