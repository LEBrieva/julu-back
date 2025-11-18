import { IsEnum, IsOptional, IsDateString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { OrderStatus, PaymentStatus } from '../order.enum';
import { FilterBaseDto } from 'src/commons/inputs/filter-base.interface';

export class FilterOrderDto extends FilterBaseDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsDateString()
  dateFrom?: string; // Fecha desde (ISO string: YYYY-MM-DD)

  @IsOptional()
  @IsDateString()
  dateTo?: string; // Fecha hasta (ISO string: YYYY-MM-DD)

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  isGuest?: boolean; // true = solo invitados, false = solo registrados, undefined = todas
}
