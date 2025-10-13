import { IsEnum } from 'class-validator';
import { OrderStatus } from '../order.enum';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
