import { Injectable, BadRequestException } from '@nestjs/common';
import { UploadApiErrorResponse, UploadApiResponse, v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  /**
   * Sube una imagen a Cloudinary
   * @param file - Archivo de Multer
   * @param folder - Carpeta en Cloudinary (ej: 'ecommerce/products/productId')
   * @returns URL de la imagen subida con transformaciones optimizadas
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          // Transformaciones automáticas
          transformation: [
            {
              quality: 'auto', // Compresión inteligente
              fetch_format: 'auto', // Formato automático (WebP si es soportado)
              angle: 'exif', // Corregir orientación según metadatos EXIF (elimina bordes negros)
              crop: 'limit', // No aumentar el tamaño original
              width: 2000, // Ancho máximo para optimizar
              height: 2000, // Alto máximo para optimizar
            },
          ],
          // Opciones adicionales
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            reject(
              new BadRequestException(
                `Error al subir imagen a Cloudinary: ${error.message}`,
              ),
            );
          }
          if (result) {
            resolve(result.secure_url);
          }
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  /**
   * Elimina una imagen de Cloudinary
   * @param publicId - ID público de la imagen (extraído de la URL)
   * @returns Resultado de la eliminación
   */
  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new BadRequestException(
        `Error al eliminar imagen de Cloudinary: ${error.message}`,
      );
    }
  }

  /**
   * Extrae el public_id de una URL de Cloudinary
   * @param url - URL completa de Cloudinary
   * @returns Public ID (folder/filename sin extensión)
   * @example
   * URL: https://res.cloudinary.com/demo/image/upload/v1234/ecommerce/products/abc123/image.jpg
   * Returns: ecommerce/products/abc123/image
   */
  extractPublicId(url: string): string {
    try {
      // Extraer la parte después de /upload/ y antes de la extensión
      const regex = /\/upload\/(?:v\d+\/)?(.+)\.\w+$/;
      const match = url.match(regex);

      if (!match || !match[1]) {
        throw new Error('URL de Cloudinary inválida');
      }

      return match[1];
    } catch (error) {
      throw new BadRequestException(
        `Error al extraer public_id de la URL: ${error.message}`,
      );
    }
  }
}
