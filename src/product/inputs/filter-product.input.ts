import { IsOptional, IsEnum, IsString, IsArray } from 'class-validator';
import { ProductColor, ProductSize, ProductStatus } from '../product.enum';
import { FilterBaseInput } from 'src/commons/inputs/filter-base.interface';

export class FilterProductInput extends FilterBaseInput {

    @IsString()
    @IsOptional()
    category?: string;

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