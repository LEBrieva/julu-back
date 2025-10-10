import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from "class-validator";
import { CATEGORY_STYLE_MAP, ProductStyle } from "../product.enum";

/**
 * Validator que verifica que el style sea compatible con la category seleccionada.
 * Funciona tanto para Create como para Update DTOs.
 */
@ValidatorConstraint({ name: 'categoryStyleValidator', async: false })
export class CategoryStyleValidator implements ValidatorConstraintInterface {
  validate(style: ProductStyle, args: ValidationArguments) {
    const object = args.object as any;
    const category = object.category;

    // Si category no está presente (caso de update parcial), no validamos style
    if (!category) {
      return true;
    }

    // Si category no es válida, no validamos style (deja que @IsEnum se encargue)
    if (!CATEGORY_STYLE_MAP[category]) {
      return true;
    }

    const allowedStyles = CATEGORY_STYLE_MAP[category];
    return allowedStyles.includes(style);
  }

  defaultMessage(args: ValidationArguments) {
    const object = args.object as any;
    const category = object.category;

    if (category && CATEGORY_STYLE_MAP[category]) {
      const allowedStyles = CATEGORY_STYLE_MAP[category];
      return `Style must be one of the following for category ${category}: ${allowedStyles.join(', ')}`;
    }

    return `Invalid style for the given category`;
  }
}
