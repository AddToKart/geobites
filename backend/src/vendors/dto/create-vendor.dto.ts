import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateVendorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  operatingHours?: Array<{
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }>;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(99.99)
  commissionRate?: number;
}
