import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMenuItemDto {
  @IsUUID()
  vendorId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price!: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @IsPositive()
  prepTimeMinutes?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;
}
