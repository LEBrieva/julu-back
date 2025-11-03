import { IsArray, IsString } from 'class-validator';

/**
 * DTO para la respuesta del upload de imágenes
 */
export class UploadImagesResponseDto {
  @IsString()
  id: string;

  @IsArray()
  @IsString({ each: true })
  images: string[];

  message: string;
}
