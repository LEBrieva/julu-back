import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import { ProductColor, ProductSize, ProductCategory, ProductStyle, CATEGORY_STYLE_MAP } from "../product.enum";
import { Type } from "class-transformer";
import { Validate, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from "class-validator";

@ValidatorConstraint({ name: 'categoryStyleValidator', async: false })
export class CategoryStyleValidator implements ValidatorConstraintInterface {
  validate(style: ProductStyle, args: ValidationArguments) {
    const object = args.object as CreateProductDto;
    const category = object.category;
    
    // Si category no es válida, no validamos style (deja que @IsEnum se encargue)
    if (!category || !CATEGORY_STYLE_MAP[category]) {
      return true; // No validamos style si category es inválida
    }
    
    const allowedStyles = CATEGORY_STYLE_MAP[category];
    return allowedStyles.includes(style);
  }

  defaultMessage(args: ValidationArguments) {
    const object = args.object as CreateProductDto;
    const category = object.category;
    
    // Solo mostramos mensaje si category es válida pero style no es compatible
    if (category && CATEGORY_STYLE_MAP[category]) {
      const allowedStyles = CATEGORY_STYLE_MAP[category];
      return `Style must be one of the following for category ${category}: ${allowedStyles.join(', ')}`;
    }
    
    return `Invalid style for the given category`;
  }
}

class CreateVariantDto{
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

export class CreateProductDto{
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
    @ValidateNested({ each: true })  // Valida cada elemento del array
    @Type(() => CreateVariantDto)    // Especifica el tipo de clase para transformación
    variants: CreateVariantDto[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];
}