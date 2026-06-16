import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreatePromotionDto {
  @IsUUID()
  vendorId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  description?: string;

  @IsEnum(['percentage', 'free_delivery', 'bogo'])
  type!: 'percentage' | 'free_delivery' | 'bogo';

  @IsNumber()
  @Min(0)
  value!: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minOrderAmount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  maxDiscount?: number;

  @IsString()
  @IsOptional()
  applicableTo?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableIds?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  usageLimit?: number;
}
