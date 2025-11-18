import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderItem } from './order.schema';
import { CreateOrderDto } from './dtos/create-order.dto';
import { CreateGuestOrderDto } from './dtos/create-guest-order.dto';
import { UpdateOrderStatusDto } from './dtos/update-order-status.dto';
import { FilterOrderDto } from './dtos/filter-order.dto';
import { CartService } from '../cart/cart.service';
import { ProductService } from '../product/product.service';
import { AddressService } from '../address/address.service';
import { OrderStatus } from './order.enum';
import { InjectModel as InjectUserModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../user/user.schema';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectUserModel(User.name) private userModel: Model<UserDocument>,
    private cartService: CartService,
    private productService: ProductService,
    private addressService: AddressService,
  ) {}

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastOrder = await this.orderModel
      .findOne({ orderNumber: new RegExp(`^ORD-${year}-`) })
      .sort({ orderNumber: -1 })
      .exec();

    let nextNumber = 1;
    if (lastOrder) {
      const lastNumber = parseInt(lastOrder.orderNumber.split('-')[2]);
      nextNumber = lastNumber + 1;
    }

    return `ORD-${year}-${nextNumber.toString().padStart(5, '0')}`;
  }

  private async getUserEmail(userId: string): Promise<string> {
    const user = await this.userModel.findById(userId).select('email').exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user.email;
  }

  async create(
    userId: string,
    createOrderDto: CreateOrderDto,
  ): Promise<OrderDocument> {
    // Obtener carrito del usuario
    const cart = await this.cartService.getCart(userId);

    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Validar stock del carrito
    const stockValidation = await this.cartService.validateCartStock(userId);
    if (!stockValidation.valid) {
      throw new BadRequestException({
        message:
          'Some items in your cart are no longer available or out of stock',
        errors: stockValidation.errors,
      });
    }

    // Obtener dirección de envío
    const address = await this.addressService.findById(
      createOrderDto.addressId,
      userId,
    );

    // Crear items de la orden con snapshot del carrito
    const orderItems: OrderItem[] = cart.items.map((item) => ({
      productId: item.productId,
      variantSKU: item.variantSKU,
      productName: item.productName,
      productImage: item.productImage,
      variantSize: item.variantSize,
      variantColor: item.variantColor,
      quantity: item.quantity,
      price: item.priceAtAdd,
      subtotal: item.quantity * item.priceAtAdd,
    }));

    // Calcular totales
    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const shippingCost = createOrderDto.shippingCost || 0;
    const total = subtotal + shippingCost;

    // Generar número de orden
    const orderNumber = await this.generateOrderNumber();

    // Obtener email del usuario
    const userEmail = await this.getUserEmail(userId);

    // Crear orden
    const order = new this.orderModel({
      orderNumber,
      userId: new Types.ObjectId(userId),
      items: orderItems,
      shippingAddress: {
        fullName: address.fullName,
        email: userEmail,
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country,
        phone: address.phone,
      },
      subtotal,
      shippingCost,
      total,
      paymentMethod: createOrderDto.paymentMethod,
      notes: createOrderDto.notes,
    });

    // Guardar orden
    await order.save();

    // Decrementar stock de productos
    for (const item of cart.items) {
      await this.productService.decreaseStock(
        String(item.productId),
        item.variantSKU,
        item.quantity,
      );
    }

    // Limpiar carrito
    await this.cartService.clearCart(userId);

    return order;
  }

  async createGuestOrder(
    createGuestOrderDto: CreateGuestOrderDto,
  ): Promise<OrderDocument> {
    const { cart, shippingAddress, paymentMethod, shippingCost, notes } =
      createGuestOrderDto;

    // Validar que el carrito no esté vacío
    if (cart.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Crear items de la orden validando stock
    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const item of cart) {
      // Obtener producto y validar stock
      const product = await this.productService.findById(item.productId);

      // Buscar variante
      const variant = product.variants.find(
        (v) => v.sku === item.variantSKU,
      );

      if (!variant) {
        throw new NotFoundException(
          `Variant ${item.variantSKU} not found for product ${product.name}`,
        );
      }

      // Validar stock
      if (variant.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name} (${variant.size}/${variant.color}). Available: ${variant.stock}`,
        );
      }

      // Calcular precio (las variantes no tienen precio, usan basePrice del producto)
      const price = product.basePrice;
      const itemSubtotal = price * item.quantity;

      orderItems.push({
        productId: new Types.ObjectId(item.productId),
        variantSKU: item.variantSKU,
        productName: product.name,
        productImage: product.images?.[0] || product.images?.[product.featuredImageIndex || 0],
        variantSize: variant.size,
        variantColor: variant.color,
        quantity: item.quantity,
        price,
        subtotal: itemSubtotal,
      });

      subtotal += itemSubtotal;
    }

    // Calcular total
    const finalShippingCost = shippingCost || 0;
    const total = subtotal + finalShippingCost;

    // Generar número de orden
    const orderNumber = await this.generateOrderNumber();

    // Crear orden con userId = null (guest order)
    const order = new this.orderModel({
      orderNumber,
      userId: null, // Guest order
      items: orderItems,
      shippingAddress: {
        fullName: shippingAddress.fullName,
        email: shippingAddress.email,
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.zipCode,
        country: shippingAddress.country,
        phone: shippingAddress.phone,
      },
      subtotal,
      shippingCost: finalShippingCost,
      total,
      paymentMethod,
      notes,
    });

    // Guardar orden
    await order.save();

    // Decrementar stock de productos
    for (const item of cart) {
      await this.productService.decreaseStock(
        item.productId,
        item.variantSKU,
        item.quantity,
      );
    }

    return order;
  }

  async findAll(userId: string, isAdmin: boolean, filterDto: FilterOrderDto) {
    const {
      status,
      paymentStatus,
      page = 1,
      limit = 10,
      search,
      dateFrom,
      dateTo,
      isGuest,
    } = filterDto;

    const query: any = {};

    // Si no es admin, solo ver sus propias órdenes
    if (!isAdmin) {
      query.userId = new Types.ObjectId(userId);
    }

    // Filtro por tipo de orden (guest vs registered)
    if (isGuest !== undefined) {
      query.userId = isGuest ? null : { $ne: null };
    }

    // Filtro por búsqueda (orderNumber)
    if (search) {
      query.orderNumber = { $regex: search, $options: 'i' };
    }

    // Filtro por estado de orden
    if (status) {
      query.status = status;
    }

    // Filtro por estado de pago
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Filtro por rango de fechas
    if (dateFrom || dateTo) {
      query.createdAt = {};

      if (dateFrom) {
        // Desde el inicio del día (00:00:00)
        query.createdAt.$gte = new Date(dateFrom);
      }

      if (dateTo) {
        // Hasta el final del día (23:59:59)
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.orderModel.countDocuments(query),
    ]);

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(
    id: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<OrderDocument> {
    const query: any = { _id: new Types.ObjectId(id) };

    // Si no es admin, solo puede ver sus propias órdenes
    if (!isAdmin) {
      query.userId = new Types.ObjectId(userId);
    }

    const order = await this.orderModel.findOne(query);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateOrderStatusDto,
  ): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // No permitir cambiar status si está cancelada
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot update status of cancelled order');
    }

    order.status = updateStatusDto.status;
    return order.save();
  }

  async cancel(id: string, userId: string): Promise<OrderDocument> {
    const order = await this.orderModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Solo se puede cancelar si está en pending
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    order.status = OrderStatus.CANCELLED;

    // Devolver stock a los productos
    for (const item of order.items) {
      await this.productService.increaseStock(
        String(item.productId),
        item.variantSKU,
        item.quantity,
      );
    }

    return order.save();
  }

  /**
   * Vincula una orden guest a un usuario registrado
   * @param orderId ID de la orden a vincular
   * @param userId ID del usuario al que vincular la orden
   * @returns Orden actualizada y shippingAddress para crear Address
   * @throws NotFoundException si la orden no existe
   * @throws BadRequestException si la orden ya está vinculada a OTRO usuario
   */
  async linkGuestOrderToUser(
    orderId: string,
    userId: string,
  ): Promise<{ order: OrderDocument; shippingAddress: any }> {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    // VALIDACIÓN CRÍTICA: Verificar si ya está vinculada
    if (order.userId !== null) {
      // Mismo usuario intentando vincular de nuevo → idempotente
      if (order.userId.toString() === userId) {
        return {
          order,
          shippingAddress: order.shippingAddress,
        };
      }

      // Usuario DIFERENTE → BLOQUEAR
      throw new BadRequestException(
        'This order is already linked to another account',
      );
    }

    // Vincular orden al usuario
    order.userId = new Types.ObjectId(userId);
    await order.save();

    return {
      order,
      shippingAddress: order.shippingAddress,
    };
  }
}
