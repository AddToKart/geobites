import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsString()
  menuItemId!: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantity!: number;
}

export class CreateOrderDto {
  @IsString()
  vendorId!: string;

  @IsString()
  @IsOptional()
  deliveryAddress?: string;

  @IsString()
  @IsOptional()
  street?: string;

  @IsString()
  @IsOptional()
  barangay?: string;

  @IsString()
  @IsOptional()
  landmark?: string;

  @IsString()
  @IsOptional()
  floorOrGate?: string;

  @IsEnum(['COD', 'GCASH', 'MAYA', 'QRPH', 'GEOPAY'])
  @IsOptional()
  paymentMethod?: 'COD' | 'GCASH' | 'MAYA' | 'QRPH' | 'GEOPAY';

  @IsString()
  @IsOptional()
  paymentReference?: string;

  @ValidateIf((object) => object.deliveryLng !== undefined)
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  deliveryLat?: number;

  @ValidateIf((object) => object.deliveryLat !== undefined)
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  deliveryLng?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountAmount?: number;

  @IsString()
  @IsOptional()
  voucherCode?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
