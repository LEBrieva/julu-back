import { IsString, MinLength } from 'class-validator';

/**
 * DTO para cambiar contraseña del usuario
 * Requiere password actual para validación de seguridad
 */
export class ChangePasswordDto {
  @IsString()
  @MinLength(6, { message: 'Current password must be at least 6 characters' })
  currentPassword: string;

  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters' })
  newPassword: string;
}
