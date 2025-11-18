import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dtos/create-order.dto';
import { CreateGuestOrderDto } from './dtos/create-guest-order.dto';
import { UpdateOrderStatusDto } from './dtos/update-order-status.dto';
import { FilterOrderDto } from './dtos/filter-order.dto';
import { OrderMapper } from './order.mapper';
import { OrderResponse, OrdersPaginatedResponse } from './dtos/order.response';
import { Roles } from 'src/commons/decorators/roles.decorator';
import { Public } from 'src/commons/decorators/public.decorator';
import { UserRole } from 'src/user/user.enum';
import type { AuthenticatedRequest } from 'src/commons/interfaces/authenticated-request.interface';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @Roles(UserRole.USER, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<OrderResponse> {
    const userId = req.user.userId;
    const order = await this.orderService.create(userId, createOrderDto);
    return OrderMapper.toResponse(order);
  }

  @Post('guest')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async createGuest(
    @Body() createGuestOrderDto: CreateGuestOrderDto,
  ): Promise<OrderResponse> {
    const order = await this.orderService.createGuestOrder(createGuestOrderDto);
    return OrderMapper.toResponse(order);
  }

  @Get()
  @Roles(UserRole.USER, UserRole.ADMIN)
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query() filterDto: FilterOrderDto,
  ): Promise<OrdersPaginatedResponse> {
    const userId = req.user.userId;
    const isAdmin = req.user.role === UserRole.ADMIN;
    const result = await this.orderService.findAll(userId, isAdmin, filterDto);
    return OrderMapper.toPaginatedResponse(result.orders, result.pagination);
  }

  @Get(':id')
  @Roles(UserRole.USER, UserRole.ADMIN)
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<OrderResponse> {
    const userId = req.user.userId;
    const isAdmin = req.user.role === UserRole.ADMIN;
    const order = await this.orderService.findById(id, userId, isAdmin);
    return OrderMapper.toResponse(order);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ): Promise<OrderResponse> {
    const order = await this.orderService.updateStatus(id, updateStatusDto);
    return OrderMapper.toResponse(order);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<OrderResponse> {
    const userId = req.user.userId;
    const order = await this.orderService.cancel(id, userId);
    return OrderMapper.toResponse(order);
  }
}
