import { PaginatedResponse } from 'src/commons/interfaces/pagination.interface';
import { User } from '../user.schema';

export interface UserResponse extends Omit<User, 'password'> {}

export interface UsersPaginatedResponse extends PaginatedResponse<UserResponse> {}