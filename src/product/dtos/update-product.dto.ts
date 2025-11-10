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
  ProductStatus,
} from '../product.enum';
import { Type } from 'class-transformer';
import { Validate } from 'class-validator';
import { CategoryStyleValidator } from '../validators/category-style.validator';

export class UpdateVariantDto {
  @IsOptional()
  @IsEnum(ProductSize)
  size?: ProductSize;

  @IsOptional()
  @IsEnum(ProductColor)
  color?: ProductColor;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @IsOptional()
  @IsEnum(ProductCategory)
  category?: ProductCategory;

  @IsOptional()
  @Validate(CategoryStyleValidator)
  style?: ProductStyle;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateVariantDto)
  variants?: UpdateVariantDto[];

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  featuredImageIndex?: number;

  @IsOptional()
  @IsBoolean()
  destacado?: boolean;
}
