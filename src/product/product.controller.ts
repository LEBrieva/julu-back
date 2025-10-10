import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ProductMapper } from "./product.mapper";
import { UserRole } from "src/user/user.enum";
import { Roles } from "src/commons/decorators/roles.decorator";
import { FilterProductsPaginatedResponse } from "./dtos/filter-product.response";
import { ProductService } from "./product.service";
import { FilterProductDto } from "./dtos/filter-product.dto";
import { CreateProductDto } from "./dtos/create-product.dto";
import { UpdateProductDto } from "./dtos/update-product.dto";
import { ProductResponse } from "./dtos/product.response";


@Controller('products')
export class ProductController{

    constructor( private readonly productService: ProductService){}

    @Post()
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createProductDto: CreateProductDto): Promise<ProductResponse> {
        const product = await this.productService.create(createProductDto);
        return ProductMapper.toProductResponse(product);
    }

    @Get()
    @Roles(UserRole.ADMIN)
    async findAll(@Query() filterDto: FilterProductDto): Promise<FilterProductsPaginatedResponse> {
        const result = await this.productService.findAll(filterDto);
        return ProductMapper.toFilterListResponse(result.products, result.pagination);
    }

    @Get('findById')
    @Roles(UserRole.ADMIN)
    async findById(@Query('id') id: string) {
        const product = await this.productService.findById(id);
        return ProductMapper.toProductResponse(product);
    }

    @Get('findByCode')
    @Roles(UserRole.ADMIN)
    async findByCode(@Query('code') code: string) {
        const product = await this.productService.findByCode(code);
        return ProductMapper.toProductResponse(product);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async update(
        @Param('id') id: string,
        @Body() updateProductDto: UpdateProductDto
    ): Promise<ProductResponse> {
        const product = await this.productService.update(id, updateProductDto);
        return ProductMapper.toProductResponse(product);
    }
}