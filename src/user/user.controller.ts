import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { FilterUserDto } from './dtos/filter-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UsersPaginatedResponse } from './dtos/users-paginated.response';
import { UsersService } from './user.service';
import { UserMapper } from './user.mapper';
import { Roles } from '../commons/decorators/roles.decorator';
import { Public } from '../commons/decorators/public.decorator';
import { UserRole } from './user.enum';
import { MongoIdDto } from 'src/commons/dtos/mongo-id.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Public() // Registro público de usuario. Quitar si sólo debe hacerlo un admin.
  // Si se desea restringir a admin, eliminar @Public y descomentar la siguiente línea:
  // @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    const { password, ...result } = user.toObject(); 
    return result;
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(@Query() filterDto: FilterUserDto): Promise<UsersPaginatedResponse> {
    const result = await this.usersService.findAll(filterDto);
    return UserMapper.toPaginatedResponse(result.users, result.pagination);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param() params: MongoIdDto) {
    return this.usersService.findOne(params.id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(@Param() params: MongoIdDto, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(params.id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN)
  remove(@Param() params: MongoIdDto) {
    return this.usersService.remove(params.id);
  }
}