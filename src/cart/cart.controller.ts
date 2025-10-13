import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dtos/add-to-cart.dto';
import { UpdateCartItemDto } from './dtos/update-cart-item.dto';
import { CartMapper } from './cart.mapper';
import { CartResponse } from './dtos/cart.response';
import { Roles } from 'src/commons/decorators/roles.decorator';
import { UserRole } from 'src/user/user.enum';
import type { AuthenticatedRequest } from 'src/commons/interfaces/authenticated-request.interface';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @Roles(UserRole.USER, UserRole.ADMIN)
  async getCart(@Req() req: AuthenticatedRequest): Promise<CartResponse> {
    const userId = req.user.userId;
    const cart = await this.cartService.getCart(userId);
    return CartMapper.toResponse(cart);
  }

  @Post('items')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async addItem(
    @Req() req: AuthenticatedRequest,
    @Body() addToCartDto: AddToCartDto,
  ): Promise<CartResponse> {
    const userId = req.user.userId;
    const cart = await this.cartService.addItem(userId, addToCartDto);
    return CartMapper.toResponse(cart);
  }

  @Patch('items/:index')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateItem(
    @Req() req: AuthenticatedRequest,
    @Param('index', ParseIntPipe) index: number,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartResponse> {
    const userId = req.user.userId;
    const cart = await this.cartService.updateItem(
      userId,
      index,
      updateCartItemDto,
    );
    return CartMapper.toResponse(cart);
  }

  @Delete('items/:index')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async removeItem(
    @Req() req: AuthenticatedRequest,
    @Param('index', ParseIntPipe) index: number,
  ): Promise<CartResponse> {
    const userId = req.user.userId;
    const cart = await this.cartService.removeItem(userId, index);
    return CartMapper.toResponse(cart);
  }

  @Delete()
  @Roles(UserRole.USER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async clearCart(@Req() req: AuthenticatedRequest): Promise<CartResponse> {
    const userId = req.user.userId;
    const cart = await this.cartService.clearCart(userId);
    return CartMapper.toResponse(cart);
  }

  @Get('validate')
  @Roles(UserRole.USER, UserRole.ADMIN)
  async validateCart(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const userId = req.user.userId;
    return this.cartService.validateCartStock(userId);
  }
}
