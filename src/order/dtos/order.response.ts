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
  items: OrderItemResponse[];
  shippingAddress: ShippingAddressResponse;
  subtotal: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrdersPaginatedResponse
  extends PaginatedResponse<OrderResponse> {}
