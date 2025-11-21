import { PaginatedResponse } from 'src/commons/interfaces/pagination.interface';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../order.enum';

export interface OrderItemResponse {
  productId: string;
  variantSKU: string;
  productName: string;
  productImage?: string;
  variantSize: string;
  variantColor: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface ShippingAddressResponse {
  fullName: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  userId?: string; // ID del usuario (null si es guest)
  items: OrderItemResponse[];
  shippingAddress: ShippingAddressResponse;
  subtotal: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
  isGuest: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * OrderListItemResponse - Versión ligera para listados (tabla admin)
 * Aplanado: customerName y customerEmail directos (no anidados)
 */
export interface OrderListItemResponse {
  id: string;
  orderNumber: string;
  customerName: string; // shippingAddress.fullName
  customerEmail: string; // shippingAddress.email
  itemsCount: number; // items.length
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  isGuest: boolean; // true = orden de invitado, false = usuario registrado
  createdAt: Date;
}

export interface OrdersPaginatedResponse
  extends PaginatedResponse<OrderListItemResponse> {}
