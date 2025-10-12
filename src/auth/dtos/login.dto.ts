import { IsEmail, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsBoolean()
  isDashboard?: boolean;
}
