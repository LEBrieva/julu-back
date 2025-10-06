import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { UserRole, UserStatus } from '../user.enum';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;
}