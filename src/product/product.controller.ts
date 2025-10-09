import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/commons/guards/jwt-auth.guard";
import { RolesGuard } from "src/commons/guards/roles.guard";
import { CreateProductResponse } from "./dtos/create-product.response";
import { ProductMapper } from "./product.mapper";
import { UserRole } from "src/user/user.enum";
import { Roles } from "src/commons/decorators/roles.decorator";
import { FilterProductsPaginatedResponse } from "./dtos/filter-product.response";
import { ProductService } from "./product.service";
import { FilterProductDto } from "./dtos/filter-product.dto";
import { CreateProductDto } from "./dtos/create-product.dto";


@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductController{

    constructor( private readonly productService: ProductService){}

    @Post()
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createProductDto: CreateProductDto): Promise<CreateProductResponse> {
        const product = await this.productService.create(createProductDto);
        return ProductMapper.toCreateResponse(product);
    }

    @Get()
    @Roles(UserRole.ADMIN)
    async findAll(@Query() filterDto: FilterProductDto): Promise<FilterProductsPaginatedResponse> {
        const result = await this.productService.findAll(filterDto);
        return ProductMapper.toFilterListResponse(result.products, result.pagination);
    }
}