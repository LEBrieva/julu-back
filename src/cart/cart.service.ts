import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument, CartItem } from './cart.schema';
import { AddToCartDto } from './dtos/add-to-cart.dto';
import { UpdateCartItemDto } from './dtos/update-cart-item.dto';
import { ProductService } from '../product/product.service';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    private productService: ProductService,
  ) {}

  async getOrCreateCart(userId: string): Promise<CartDocument> {
    let cart = await this.cartModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!cart) {
      cart = new this.cartModel({
        userId: new Types.ObjectId(userId),
        items: [],
      });
      await cart.save();
    }

    return cart;
  }

  async addItem(
    userId: string,
    addToCartDto: AddToCartDto,
  ): Promise<CartDocument> {
    // Verificar que el producto y variante existan
    const product = await this.productService.findById(addToCartDto.productId);
    const variant = product.variants.find(
      (v) => v.sku === addToCartDto.variantSKU,
    );

    if (!variant) {
      throw new NotFoundException(
        `Variant with SKU ${addToCartDto.variantSKU} not found`,
      );
    }

    // Verificar stock disponible
    if (variant.stock < addToCartDto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${variant.stock}, Requested: ${addToCartDto.quantity}`,
      );
    }

    const cart = await this.getOrCreateCart(userId);

    // Verificar si el item ya existe en el carrito
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        String(item.productId) === addToCartDto.productId &&
        item.variantSKU === addToCartDto.variantSKU,
    );

    if (existingItemIndex !== -1) {
      // Actualizar cantidad del item existente
      const newQuantity =
        cart.items[existingItemIndex].quantity + addToCartDto.quantity;

      // Verificar stock para la nueva cantidad
      if (variant.stock < newQuantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${variant.stock}, Total requested: ${newQuantity}`,
        );
      }

      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Agregar nuevo item
      const newItem: CartItem = {
        productId: new Types.ObjectId(addToCartDto.productId),
        variantSKU: addToCartDto.variantSKU,
        quantity: addToCartDto.quantity,
        priceAtAdd: variant.price,
        productName: product.name,
        productImage: product.images?.[0],
        variantSize: variant.size,
        variantColor: variant.color,
      };

      cart.items.push(newItem);
    }

    return cart.save();
  }

  async updateItem(
    userId: string,
    itemIndex: number,
    updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartDocument> {
    const cart = await this.getOrCreateCart(userId);

    if (itemIndex < 0 || itemIndex >= cart.items.length) {
      throw new NotFoundException('Cart item not found');
    }

    const item = cart.items[itemIndex];

    // Verificar stock disponible para la nueva cantidad
    const product = await this.productService.findById(String(item.productId));
    const variant = product.variants.find((v) => v.sku === item.variantSKU);

    if (!variant) {
      throw new NotFoundException(
        `Variant with SKU ${item.variantSKU} not found`,
      );
    }

    if (variant.stock < updateCartItemDto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${variant.stock}, Requested: ${updateCartItemDto.quantity}`,
      );
    }

    cart.items[itemIndex].quantity = updateCartItemDto.quantity;

    return cart.save();
  }

  async removeItem(userId: string, itemIndex: number): Promise<CartDocument> {
    const cart = await this.getOrCreateCart(userId);

    if (itemIndex < 0 || itemIndex >= cart.items.length) {
      throw new NotFoundException('Cart item not found');
    }

    cart.items.splice(itemIndex, 1);

    return cart.save();
  }

  async clearCart(userId: string): Promise<CartDocument> {
    const cart = await this.getOrCreateCart(userId);
    cart.items = [];
    return cart.save();
  }

  async getCart(userId: string): Promise<CartDocument> {
    return this.getOrCreateCart(userId);
  }

  async validateCartStock(userId: string): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const cart = await this.getOrCreateCart(userId);
    const errors: string[] = [];

    for (const item of cart.items) {
      try {
        const product = await this.productService.findById(
          String(item.productId),
        );
        const variant = product.variants.find((v) => v.sku === item.variantSKU);

        if (!variant) {
          errors.push(
            `Variant ${item.variantSKU} of ${item.productName} is no longer available`,
          );
          continue;
        }

        if (variant.stock < item.quantity) {
          errors.push(
            `Insufficient stock for ${item.productName} (${item.variantSKU}). Available: ${variant.stock}, In cart: ${item.quantity}`,
          );
        }
      } catch (error) {
        errors.push(`Product ${item.productName} is no longer available`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
