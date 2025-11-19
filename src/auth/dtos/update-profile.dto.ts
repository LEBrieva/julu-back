import { IsOptional, IsString, MinLength } from 'class-validator';

/**
 * DTO para actualizar información del perfil de usuario
 * Solo permite actualizar firstName, lastName y phone
 * NO permite cambiar email, role, status, emailVerified
 */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters' })
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
