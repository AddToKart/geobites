export declare class CreateOrderItemDto {
    menuItemId: string;
    quantity: number;
}
export declare class CreateOrderDto {
    vendorId: string;
    street?: string;
    barangay?: string;
    landmark?: string;
    floorOrGate?: string;
    paymentMethod?: 'COD' | 'GCASH' | 'MAYA' | 'QRPH';
    deliveryLat?: number;
    deliveryLng?: number;
    notes?: string;
    items: CreateOrderItemDto[];
}
