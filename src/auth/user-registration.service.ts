import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuthService } from './auth.service';
import { OrderService } from '../order/order.service';
import { AddressService } from '../address/address.service';
import { RegisterDto } from './dtos/register.dto';
import { UserDocument } from '../user/user.schema';

/**
 * Servicio Facade para orquestar el proceso de registro de usuario
 * Coordina AuthService, OrderService y AddressService sin acoplarlos entre sí
 */
@Injectable()
export class UserRegistrationService {
  private readonly logger = new Logger(UserRegistrationService.name);

  constructor(
    private readonly authService: AuthService,
    private readonly orderService: OrderService,
    private readonly addressService: AddressService,
  ) {}

  /**
   * Registra un nuevo usuario y opcionalmente vincula una orden guest
   * @param registerDto Datos de registro del usuario
   * @returns Usuario creado
   * @throws ConflictException si el email ya existe
   * @throws BadRequestException si la orden ya está vinculada a otro usuario
   */
  async registerUser(registerDto: RegisterDto): Promise<UserDocument> {
    // PASO 1: Crear usuario
    const user = await this.authService.createUser({
      email: registerDto.email,
      password: registerDto.password,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phone: registerDto.phone,
    });

    const userId = (user._id as Types.ObjectId).toString();

    // PASO 2: Si hay orden guest, vincular + crear dirección
    if (registerDto.linkedGuestOrderId) {
      try {
        // 2a. Vincular orden (puede lanzar BadRequestException si ya vinculada)
        const { shippingAddress } =
          await this.orderService.linkGuestOrderToUser(
            registerDto.linkedGuestOrderId,
            userId,
          );

        // 2b. Crear dirección desde shippingAddress de la orden
        await this.addressService.create(userId, {
          fullName: shippingAddress.fullName,
          street: shippingAddress.street,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zipCode: shippingAddress.zipCode,
          country: shippingAddress.country,
          phone: shippingAddress.phone,
          isDefault: true,
        });

        this.logger.log(
          `Guest order ${registerDto.linkedGuestOrderId} linked to user ${userId}`,
        );
      } catch (error) {
        // Si la orden ya está vinculada a OTRO usuario, el error se propaga
        // (el usuario NO se crea porque linkGuestOrderToUser lanza antes de llegar aquí)
        this.logger.error(`Failed to link guest order: ${error.message}`);
        throw error; // Re-lanzar para que el controller maneje
      }
    }

    return user;
  }
}
