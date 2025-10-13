import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dtos/create-address.dto';
import { UpdateAddressDto } from './dtos/update-address.dto';
import { AddressMapper } from './address.mapper';
import { AddressResponse } from './dtos/address.response';
import { Roles } from 'src/commons/decorators/roles.decorator';
import { UserRole } from 'src/user/user.enum';
import type { AuthenticatedRequest } from 'src/commons/interfaces/authenticated-request.interface';

@Controller('addresses')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  @Roles(UserRole.USER, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createAddressDto: CreateAddressDto,
  ): Promise<AddressResponse> {
    const userId = req.user.userId;
    const address = await this.addressService.create(userId, createAddressDto);
    return AddressMapper.toResponse(address);
  }

  @Get()
  @Roles(UserRole.USER, UserRole.ADMIN)
  async findAll(@Req() req: AuthenticatedRequest): Promise<AddressResponse[]> {
    const userId = req.user.userId;
    const addresses = await this.addressService.findAllByUser(userId);
    return AddressMapper.toResponseList(addresses);
  }

  @Get(':id')
  @Roles(UserRole.USER, UserRole.ADMIN)
  async findOne(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<AddressResponse> {
    const userId = req.user.userId;
    const address = await this.addressService.findById(id, userId);
    return AddressMapper.toResponse(address);
  }

  @Patch(':id')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() updateAddressDto: UpdateAddressDto,
  ): Promise<AddressResponse> {
    const userId = req.user.userId;
    const address = await this.addressService.update(
      id,
      userId,
      updateAddressDto,
    );
    return AddressMapper.toResponse(address);
  }

  @Delete(':id')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    const userId = req.user.userId;
    await this.addressService.remove(id, userId);
  }

  @Patch(':id/set-default')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async setDefault(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<AddressResponse> {
    const userId = req.user.userId;
    const address = await this.addressService.setDefault(id, userId);
    return AddressMapper.toResponse(address);
  }
}
