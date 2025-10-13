import { AddressDocument } from './address.schema';
import { AddressResponse } from './dtos/address.response';

export class AddressMapper {
  static toResponse(address: AddressDocument): AddressResponse {
    return {
      id: String(address._id),
      fullName: address.fullName,
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      phone: address.phone,
      isDefault: address.isDefault,
      createdAt: address.createdAt || new Date(),
      updatedAt: address.updatedAt || new Date(),
    };
  }

  static toResponseList(addresses: AddressDocument[]): AddressResponse[] {
    return addresses.map((address) => this.toResponse(address));
  }
}
