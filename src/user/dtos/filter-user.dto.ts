import { IsOptional, IsEnum, IsString } from 'class-validator';
import { UserRole, UserStatus } from '../user.enum';
import { FilterBaseDto } from 'src/commons/inputs/filter-base.interface';

export class FilterUserDto extends FilterBaseDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

}