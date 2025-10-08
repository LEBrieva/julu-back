import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/commons/guards/jwt-auth.guard";
import { RolesGuard } from "src/commons/guards/roles.guard";
import { CreateProductInput } from "./inputs/create-product.input";
import { CreateProductResponse } from "./output/create-product.response";
import { ProductMapper } from "./product.mapper";
import { UserRole } from "src/user/user.enum";
import { Roles } from "src/commons/decorators/roles.decorator";
import { FilterProductInput } from "./inputs/filter-product.input";
import { FilterProductsPaginatedResponse } from "./output/filter-product.response";
import { ProductService } from "./product.service";


@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductController{

    constructor( private readonly productService: ProductService){}

    @Post()
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createProductDto: CreateProductInput): Promise<CreateProductResponse> {
        const product = await this.productService.create(createProductDto);
        return ProductMapper.toCreateResponse(product);
    }

    @Get()
    @Roles(UserRole.ADMIN)
    async findAll(@Query() filterDto: FilterProductInput): Promise<FilterProductsPaginatedResponse> {
        const result = await this.productService.findAll(filterDto);
        return ProductMapper.toFilterListResponse(result.products, result.pagination);
    }
}