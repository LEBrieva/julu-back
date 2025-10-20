import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderItem } from './order.schema';
import { CreateOrderDto } from './dtos/create-order.dto';
import { UpdateOrderStatusDto } from './dtos/update-order-status.dto';
import { FilterOrderDto } from './dtos/filter-order.dto';
import { CartService } from '../cart/cart.service';
import { ProductService } from '../product/product.service';
import { AddressService } from '../address/address.service';
import { OrderStatus } from './order.enum';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
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

    // Crear orden
    const order = new this.orderModel({
      orderNumber,
      userId: new Types.ObjectId(userId),
      items: orderItems,
      shippingAddress: {
        fullName: address.fullName,
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

  async findAll(userId: string, isAdmin: boolean, filterDto: FilterOrderDto) {
    const {
      status,
      paymentStatus,
      page = 1,
      limit = 10,
      search,
      dateFrom,
      dateTo,
    } = filterDto;

    const query: any = {};

    // Si no es admin, solo ver sus propias órdenes
    if (!isAdmin) {
      query.userId = new Types.ObjectId(userId);
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
}
