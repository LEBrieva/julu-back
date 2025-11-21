import { PaginationMeta } from 'src/commons/interfaces/pagination.interface';
import { OrderDocument } from './order.schema';
import {
  OrderResponse,
  OrderItemResponse,
  ShippingAddressResponse,
  OrderListItemResponse,
  OrdersPaginatedResponse,
} from './dtos/order.response';

export class OrderMapper {
  static toResponse(order: OrderDocument): OrderResponse {
    const items: OrderItemResponse[] = order.items.map((item) => ({
      productId: String(item.productId),
      variantSKU: item.variantSKU,
      productName: item.productName,
      productImage: item.productImage,
      variantSize: item.variantSize,
      variantColor: item.variantColor,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
    }));

    const shippingAddress: ShippingAddressResponse = {
      fullName: order.shippingAddress.fullName,
      email: order.shippingAddress.email,
      street: order.shippingAddress.street,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      zipCode: order.shippingAddress.zipCode,
      country: order.shippingAddress.country,
      phone: order.shippingAddress.phone,
    };

    return {
      id: String(order._id),
      orderNumber: order.orderNumber,
      userId: order.userId ? String(order.userId) : undefined,
      items,
      shippingAddress,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      total: order.total,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      notes: order.notes,
      isGuest: order.userId === null,
      createdAt: order.createdAt || new Date(),
      updatedAt: order.updatedAt || new Date(),
    };
  }

  /**
   * Mapea un OrderDocument a OrderListItemResponse (versión ligera para listados)
   */
  static toListItemResponse(order: OrderDocument): OrderListItemResponse {
    return {
      id: String(order._id),
      orderNumber: order.orderNumber,
      customerName: order.shippingAddress.fullName,
      customerEmail: order.shippingAddress.email,
      itemsCount: order.items.length,
      total: order.total,
      status: order.status,
      paymentStatus: order.paymentStatus,
      isGuest: order.userId === null,
      createdAt: order.createdAt || new Date(),
    };
  }

  static toPaginatedResponse(
    orders: OrderDocument[],
    pagination: PaginationMeta,
  ): OrdersPaginatedResponse {
    return {
      data: orders.map((order) => this.toListItemResponse(order)),
      pagination,
    };
  }
}
