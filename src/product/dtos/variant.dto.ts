import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ProductColor, ProductSize } from '../product.enum';

export class AddVariantDto {
  @IsEnum(ProductSize)
  size: ProductSize;

  @IsEnum(ProductColor)
  color: ProductColor;

  @IsNumber()
  @Min(0)
  stock: number;
}

export class UpdateSingleVariantDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;
}
