import { IsIn } from 'class-validator';

export class UpdateDeliveryStatusDto {
  @IsIn(['ready_for_pickup', 'picked_up', 'delivering', 'delivered'])
  status!: 'ready_for_pickup' | 'picked_up' | 'delivering' | 'delivered';
}
