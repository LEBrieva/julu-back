import {
  IsOptional,
  IsEnum,
  IsString,
  IsArray,
  IsNumber,
  Min,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  ProductColor,
  ProductSize,
  ProductStatus,
  ProductCategory,
  ProductStyle,
} from '../product.enum';
import { FilterBaseDto } from 'src/commons/inputs/filter-base.interface';

export class FilterProductDto extends FilterBaseDto {
  @IsEnum(ProductCategory)
  @IsOptional()
  @Transform(({ value }) => value?.toLowerCase())
  category?: ProductCategory;

  @IsEnum(ProductStyle)
  @IsOptional()
  @Transform(({ value }) => value?.toLowerCase())
  style?: ProductStyle;

  @IsString()
  @IsOptional()
  code?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((tag) => tag.trim());
    }
    return value;
  })
  tags?: string[];

  @IsEnum(ProductSize)
  @IsOptional()
  @Transform(({ value }) => value?.toLowerCase())
  size?: ProductSize;

  @IsEnum(ProductColor)
  @IsOptional()
  @Transform(({ value }) => value?.toLowerCase())
  color?: ProductColor;

  @IsOptional()
  @IsEnum(ProductStatus)
  @Transform(({ value }) => value?.toLowerCase())
  status?: ProductStatus;

  // ==================== FILTROS AVANZADOS (FASE 8b) ====================

  // Filtros de precio (rango en variantes)
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  // Ordenamiento dinámico
  @IsOptional()
  @IsEnum(['newest', 'price_asc', 'price_desc', 'name_asc', 'name_desc'])
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';

  // Filtros múltiples de tallas (reemplaza size singular en queries complejas)
  @IsOptional()
  @IsArray()
  @IsEnum(ProductSize, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim().toUpperCase());
    }
    return value;
  })
  sizes?: ProductSize[];

  // Filtros múltiples de colores (reemplaza color singular en queries complejas)
  @IsOptional()
  @IsArray()
  @IsEnum(ProductColor, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((c) => c.trim().toLowerCase());
    }
    return value;
  })
  colors?: ProductColor[];

  // Filtros múltiples de estilos (solo remeras: regular, oversize, slim_fit)
  @IsOptional()
  @IsArray()
  @IsEnum(ProductStyle, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim().toLowerCase());
    }
    return value;
  })
  styles?: ProductStyle[];

  // Filtro de productos destacados
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  destacado?: boolean;
}
