import { IsOptional, IsEnum, IsString, IsArray } from 'class-validator';
import { ProductColor, ProductSize, ProductStatus, ProductCategory, ProductStyle } from '../product.enum';
import { FilterBaseDto } from 'src/commons/inputs/filter-base.interface';

export class FilterProductDto extends FilterBaseDto {

    @IsEnum(ProductCategory)
    @IsOptional()
    category?: ProductCategory;

    @IsEnum(ProductStyle)
    @IsOptional()
    style?: ProductStyle;

    @IsString()
    @IsOptional()
    code?: string;

    @IsOptional()
    @IsArray()
    tags?: string[];

    @IsEnum(ProductSize)
    @IsOptional()
    size?: ProductSize;

    @IsEnum(ProductColor)
    @IsOptional()
    color?: ProductColor;

    @IsOptional()
    @IsEnum(ProductStatus)
    status?: ProductStatus;
}