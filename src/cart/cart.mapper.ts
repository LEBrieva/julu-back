import { CartDocument } from './cart.schema';
import { CartResponse, CartItemResponse } from './dtos/cart.response';

export class CartMapper {
  static toResponse(cart: CartDocument): CartResponse {
    const items: CartItemResponse[] = cart.items.map((item, index) => ({
      id: String(index), // Usamos el índice como ID del item
      productId: String(item.productId),
      productName: item.productName,
      productImage: item.productImage,
      variantSKU: item.variantSKU,
      variantSize: item.variantSize,
      variantColor: item.variantColor,
      quantity: item.quantity,
      priceAtAdd: item.priceAtAdd,
      subtotal: item.quantity * item.priceAtAdd,
    }));

    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      id: String(cart._id),
      items,
      totalItems,
      totalAmount,
      createdAt: cart.createdAt || new Date(),
      updatedAt: cart.updatedAt || new Date(),
    };
  }
}
