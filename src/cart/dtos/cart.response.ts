export interface CartItemResponse {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  variantSKU: string;
  variantSize: string;
  variantColor: string;
  quantity: number;
  priceAtAdd: number;
  subtotal: number;
}

export interface CartResponse {
  id: string;
  items: CartItemResponse[];
  totalItems: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}
