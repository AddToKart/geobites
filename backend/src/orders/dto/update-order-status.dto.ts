import { IsIn, IsOptional, IsString } from 'class-validator';
import { ORDER_STATUSES } from '../../common/constants/order-status';

export class UpdateOrderStatusDto {
  @IsIn(ORDER_STATUSES)
  status!: string;

  @IsOptional()
  @IsString()
  cancellationReason?: string;
}
