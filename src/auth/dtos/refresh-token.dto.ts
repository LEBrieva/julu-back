import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsOptional() // Opcional porque puede venir de cookie
  refreshToken?: string;
}
