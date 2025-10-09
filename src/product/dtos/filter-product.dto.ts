import { IsOptional, IsEnum, IsString, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import { ProductColor, ProductSize, ProductStatus, ProductCategory, ProductStyle } from '../product.enum';
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
            return value.split(',').map(tag => tag.trim());
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
}