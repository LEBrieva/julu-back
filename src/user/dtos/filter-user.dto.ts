import { IsOptional, IsEnum, IsString } from 'class-validator';
import { UserRole, UserStatus } from '../user.enum';
import { FilterBaseInput } from 'src/commons/inputs/filter-base.interface';

export class FilterUserDto extends FilterBaseInput {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

}