import { PaginationMeta } from 'src/commons/interfaces/pagination.interface';
import { User, UserDocument } from './user.schema';
import {
  UserResponse,
  UsersPaginatedResponse,
} from './dtos/users-paginated.response';

export class UserMapper {
  static toResponse(user: UserDocument | any): UserResponse {
    // Si es un documento de Mongoose, convertir a objeto plano
    const userObject = user.toObject ? user.toObject() : user;
    const { password, _id, ...rest } = userObject;

    return {
      id: _id?.toString() || _id, // Transformar _id de MongoDB a id como string
      ...rest,
    } as UserResponse;
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
