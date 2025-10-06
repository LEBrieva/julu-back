import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dtos/create-user.dto';
import { FilterUserDto } from './dtos/filter-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userModel.findOne({ email: createUserDto.email });
    
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    return createdUser.save();
  }

  async findAll(filterDto: FilterUserDto) {
    const { role, status, search, page = '1', limit = '10' } = filterDto;
    
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

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
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
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password').exec();
    
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
      updateData.password = await bcrypt.hash(updateUserDto.password, saltRounds);
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

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { lastLogin: new Date() });
  }

}