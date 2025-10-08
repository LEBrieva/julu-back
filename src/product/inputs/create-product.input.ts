import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import { ProductColor, ProductSize } from "../product.enum";
import { Type } from "class-transformer";

class CreateVariantInput{
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

export class CreateProductInput{
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @Min(0)
    basePrice: number;

    @IsArray()
    @ValidateNested({ each: true })  // Valida cada elemento del array
    @Type(() => CreateVariantInput)    // Especifica el tipo de clase para transformación
    variants: CreateVariantInput[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];
}