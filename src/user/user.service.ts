import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dtos/create-user.dto';
import { FilterUserDto } from './dtos/filter-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { User, UserDocument } from './user.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // ⚠️ IMPORTANTE: El password ya viene hasheado desde AuthService.createUser()
    // NO hashear de nuevo aquí para evitar doble hash
    const createdUser = new this.userModel({
      ...createUserDto,
    });

    return createdUser.save();
  }

  async findAll(filterDto: FilterUserDto) {
    const { role, status, search, page = 1, limit = 10 } = filterDto;

    const query: any = {};

    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = page;
    const limitNum = limit;
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .select('-password')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 })
        .exec(),
      this.userModel.countDocuments(query),
    ]);

    return {
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async findOne(id: string) {
    // Validar que el ID no sea null, undefined o vacío
    if (!id || id === 'null' || id === 'undefined') {
      throw new BadRequestException('User ID is required');
    }

    // Validar formato de ObjectId
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const user = await this.userModel
      .findById(id)
      .select('-password')
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const updateData = { ...updateUserDto };

    if (updateUserDto.password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(
        updateUserDto.password,
        saltRounds,
      );
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException('User not found');
    }
  }

  /**
   * Actualiza el avatar del usuario
   * - Sube nueva imagen a Cloudinary
   * - Elimina avatar anterior si existe
   * - Actualiza campo avatar del usuario
   */
  async updateAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<UserDocument> {
    // Validar que el usuario existe
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Si tiene avatar anterior, eliminarlo de Cloudinary
    if (user.avatar) {
      try {
        const publicId = this.cloudinaryService.extractPublicId(user.avatar);
        await this.cloudinaryService.deleteImage(publicId);
      } catch (error) {
        // Continuar aunque falle la eliminación (puede que la imagen ya no exista en Cloudinary)
        console.warn(
          `No se pudo eliminar avatar anterior de Cloudinary:`,
          error,
        );
      }
    }

    // Subir nueva imagen a Cloudinary
    const avatarUrl = await this.cloudinaryService.uploadImage(
      file,
      `ecommerce/users/${userId}`,
    );

    // Actualizar usuario con nueva URL
    user.avatar = avatarUrl;
    return user.save();
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { lastLogin: new Date() });
  }
}
