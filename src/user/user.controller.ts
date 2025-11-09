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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
    return UserMapper.toResponse(user);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query() filterDto: FilterUserDto,
  ): Promise<UsersPaginatedResponse> {
    const result = await this.usersService.findAll(filterDto);
    return UserMapper.toPaginatedResponse(result.users, result.pagination);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findOne(@Param() params: MongoIdDto) {
    const user = await this.usersService.findOne(params.id);
    return UserMapper.toResponse(user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param() params: MongoIdDto,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(params.id, updateUserDto);
    return UserMapper.toResponse(user);
  }

  /**
   * Upload de avatar a Cloudinary
   * PATCH /users/:id/avatar
   */
  @Patch(':id/avatar')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/^image\/(jpeg|jpg|png|webp)$/)) {
          return callback(
            new BadRequestException(
              'Solo se permiten imágenes (JPEG, PNG, WebP)',
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadAvatar(
    @Param() params: MongoIdDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    const user = await this.usersService.updateAvatar(params.id, file);
    return UserMapper.toResponse(user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN)
  remove(@Param() params: MongoIdDto) {
    return this.usersService.remove(params.id);
  }
}
