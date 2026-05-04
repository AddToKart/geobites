import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsUUID()
  menuItemId!: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantity!: number;
}

export class CreateOrderDto {
  @IsUUID()
  vendorId!: string;

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

  @IsEnum(['COD', 'GCASH', 'MAYA', 'QRPH'])
  @IsOptional()
  paymentMethod?: 'COD' | 'GCASH' | 'MAYA' | 'QRPH';

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

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
