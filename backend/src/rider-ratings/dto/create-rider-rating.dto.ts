import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateRiderRatingDto {
  @IsUUID()
  orderId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  score!: number;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  feedback?: string;
}
