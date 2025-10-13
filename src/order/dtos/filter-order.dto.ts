import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatus, PaymentStatus } from '../order.enum';
import { FilterBaseDto } from 'src/commons/inputs/filter-base.interface';

export class FilterOrderDto extends FilterBaseDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;
}
