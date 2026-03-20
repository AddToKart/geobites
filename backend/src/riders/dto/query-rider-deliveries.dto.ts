import { IsIn, IsOptional } from 'class-validator';

export class QueryRiderDeliveriesDto {
  @IsOptional()
  @IsIn(['available', 'active'])
  type?: 'available' | 'active';
}
