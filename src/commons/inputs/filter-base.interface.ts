import { IsOptional, IsString, IsPositive, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterBaseDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
