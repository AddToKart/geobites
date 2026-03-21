import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class UpdateRiderLocationDto {
  @Type(() => Number)
  @IsNumber()
  riderLat!: number;

  @Type(() => Number)
  @IsNumber()
  riderLng!: number;
}
