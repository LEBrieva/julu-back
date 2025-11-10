import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  ProductColor,
  ProductSize,
  ProductCategory,
  ProductStyle,
} from '../product.enum';
import { Type } from 'class-transformer';
import { Validate } from 'class-validator';
import { CategoryStyleValidator } from '../validators/category-style.validator';

class CreateVariantDto {
  @IsEnum(ProductSize)
  size: ProductSize;

  @IsEnum(ProductColor)
  color: ProductColor;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsNumber()
  @Min(0)
  price: number; // Puede variar por variante
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  basePrice: number;

  @IsEnum(ProductCategory)
  category: ProductCategory;

  @Validate(CategoryStyleValidator)
  style: ProductStyle;

  @IsArray()
  @ValidateNested({ each: true }) // Valida cada elemento del array
  @Type(() => CreateVariantDto) // Especifica el tipo de clase para transformación
  variants: CreateVariantDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  destacado?: boolean;
}
