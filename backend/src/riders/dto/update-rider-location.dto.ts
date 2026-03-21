import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdateRiderLocationDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  riderLat!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  riderLng!: number;
}
