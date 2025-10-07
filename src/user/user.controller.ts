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
import { UsersService } from './user.service';
import { Roles } from '../commons/decorators/roles.decorator';
import { Public } from '../commons/decorators/public.decorator';
import { JwtAuthGuard } from 'src/commons/guards/jwt-auth.guard';
import { RolesGuard } from 'src/commons/guards/roles.guard';
import { UserRole } from './user.enum';
import { MongoIdDto } from 'src/commons/dtos/mongo-id.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
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
  findAll(@Query() filterDto: FilterUserDto) {
    return this.usersService.findAll(filterDto);
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