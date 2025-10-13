import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Address, AddressDocument } from './address.schema';
import { CreateAddressDto } from './dtos/create-address.dto';
import { UpdateAddressDto } from './dtos/update-address.dto';

@Injectable()
export class AddressService {
  constructor(
    @InjectModel(Address.name) private addressModel: Model<AddressDocument>,
  ) {}

  async create(
    userId: string,
    createAddressDto: CreateAddressDto,
  ): Promise<AddressDocument> {
    // Si es la primera dirección del usuario, marcarla como default
    const existingAddresses = await this.addressModel.countDocuments({
      userId: new Types.ObjectId(userId),
    });

    const isDefault = createAddressDto.isDefault ?? existingAddresses === 0;

    // Si se marca como default, desmarcar las demás
    if (isDefault) {
      await this.addressModel.updateMany(
        { userId: new Types.ObjectId(userId), isDefault: true },
        { $set: { isDefault: false } },
      );
    }

    const address = new this.addressModel({
      ...createAddressDto,
      userId: new Types.ObjectId(userId),
      isDefault,
    });

    return address.save();
  }

  async findAllByUser(userId: string): Promise<AddressDocument[]> {
    return this.addressModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ isDefault: -1, createdAt: -1 })
      .exec();
  }

  async findById(id: string, userId: string): Promise<AddressDocument> {
    const address = await this.addressModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  async update(
    id: string,
    userId: string,
    updateAddressDto: UpdateAddressDto,
  ): Promise<AddressDocument> {
    const address = await this.findById(id, userId);

    // Si se marca como default, desmarcar las demás
    if (updateAddressDto.isDefault) {
      await this.addressModel.updateMany(
        {
          userId: new Types.ObjectId(userId),
          _id: { $ne: new Types.ObjectId(id) },
        },
        { $set: { isDefault: false } },
      );
    }

    Object.assign(address, updateAddressDto);
    return address.save();
  }

  async remove(id: string, userId: string): Promise<void> {
    const address = await this.findById(id, userId);

    // No permitir eliminar si es la última dirección
    const totalAddresses = await this.addressModel.countDocuments({
      userId: new Types.ObjectId(userId),
    });

    if (totalAddresses === 1) {
      throw new BadRequestException(
        'Cannot delete the last address. Add another address first.',
      );
    }

    // Si era la dirección default, marcar otra como default
    if (address.isDefault) {
      const nextAddress = await this.addressModel.findOne({
        userId: new Types.ObjectId(userId),
        _id: { $ne: new Types.ObjectId(id) },
      });

      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    await this.addressModel.deleteOne({ _id: new Types.ObjectId(id) });
  }

  async setDefault(id: string, userId: string): Promise<AddressDocument> {
    const address = await this.findById(id, userId);

    // Desmarcar todas las demás direcciones
    await this.addressModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        _id: { $ne: new Types.ObjectId(id) },
      },
      { $set: { isDefault: false } },
    );

    address.isDefault = true;
    return address.save();
  }

  async getDefaultAddress(userId: string): Promise<AddressDocument | null> {
    return this.addressModel.findOne({
      userId: new Types.ObjectId(userId),
      isDefault: true,
    });
  }
}
