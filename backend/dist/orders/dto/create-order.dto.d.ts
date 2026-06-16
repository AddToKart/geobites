export declare class CreateOrderItemDto {
    menuItemId: string;
    quantity: number;
}
export declare class CreateOrderDto {
    vendorId: string;
    deliveryAddress?: string;
    street?: string;
    barangay?: string;
    landmark?: string;
    floorOrGate?: string;
    paymentMethod?: 'COD' | 'GEOPAY';
    paymentReference?: string;
    deliveryLat?: number;
    deliveryLng?: number;
    notes?: string;
    discountAmount?: number;
    voucherCode?: string;
    items: CreateOrderItemDto[];
}
