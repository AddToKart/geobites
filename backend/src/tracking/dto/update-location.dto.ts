import { IsNumber, IsOptional, IsUUID } from 'class-validator';

export class UpdateLocationDto {
  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;

  @IsUUID()
  @IsOptional()
  orderId?: string;
}
