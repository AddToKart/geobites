import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateVoucherDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  code!: string;

  @IsString()
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['fixed', 'percentage'])
  discountType!: 'fixed' | 'percentage';

  @IsNumber()
  @IsPositive()
  discountValue!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minOrderAmount?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  maxUses?: number;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  expiresAt!: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
