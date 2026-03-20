import { IsIn } from 'class-validator';
import { ORDER_STATUSES } from '../../common/constants/order-status';

export class UpdateOrderStatusDto {
  @IsIn(ORDER_STATUSES)
  status!: string;
}
