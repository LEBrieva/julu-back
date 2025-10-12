import { PaginationMeta } from 'src/commons/interfaces/pagination.interface';
import { User, UserDocument } from './user.schema';
import {
  UserResponse,
  UsersPaginatedResponse,
} from './dtos/users-paginated.response';

export class UserMapper {
  static toResponse(user: UserDocument): UserResponse {
    const { password, ...result } = user.toObject();
    return result;
  }

  static toPaginatedResponse(
    users: UserDocument[],
    pagination: PaginationMeta,
  ): UsersPaginatedResponse {
    return {
      data: users.map((user) => this.toResponse(user)),
      pagination,
    };
  }
}
