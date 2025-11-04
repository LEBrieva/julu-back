import { IsInt, IsNotEmpty, Min } from 'class-validator';

/**
 * DTO para establecer la imagen destacada/portada de un producto
 */
export class SetFeaturedImageDto {
  @IsNotEmpty({ message: 'El índice de la imagen es requerido' })
  @IsInt({ message: 'El índice debe ser un número entero' })
  @Min(0, { message: 'El índice debe ser mayor o igual a 0' })
  index: number;
}
