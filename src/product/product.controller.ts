import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductMapper } from './product.mapper';
import { UserRole } from 'src/user/user.enum';
import { Roles } from 'src/commons/decorators/roles.decorator';
import { Public } from 'src/commons/decorators/public.decorator';
import { FilterProductsPaginatedResponse } from './dtos/filter-product.response';
import { ProductService } from './product.service';
import { FilterProductDto } from './dtos/filter-product.dto';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { AddVariantDto, UpdateSingleVariantDto } from './dtos/variant.dto';
import { ProductResponse } from './dtos/product.response';
import { UploadImagesResponseDto } from './dto/upload-images.dto';
import { SetFeaturedImageDto } from './dto/set-featured-image.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createProductDto: CreateProductDto,
  ): Promise<ProductResponse> {
    const product = await this.productService.create(createProductDto);
    return ProductMapper.toProductResponse(product);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query() filterDto: FilterProductDto,
  ): Promise<FilterProductsPaginatedResponse> {
    const result = await this.productService.findAll(filterDto);
    return ProductMapper.toFilterListResponse(
      result.products,
      result.pagination,
    );
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
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductResponse> {
    const product = await this.productService.update(id, updateProductDto);
    return ProductMapper.toProductResponse(product);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id') id: string): Promise<ProductResponse> {
    const product = await this.productService.deactivate(id);
    return ProductMapper.toProductResponse(product);
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async activate(@Param('id') id: string): Promise<ProductResponse> {
    const product = await this.productService.activate(id);
    return ProductMapper.toProductResponse(product);
  }

  @Get('catalog')
  @Public()
  async getCatalog(
    @Query() filterDto: FilterProductDto,
  ): Promise<FilterProductsPaginatedResponse> {
    const result = await this.productService.findAllActive(filterDto);
    return ProductMapper.toFilterListResponse(
      result.products,
      result.pagination,
    );
  }

  @Get('catalog/:id')
  @Public()
  async getCatalogProductById(
    @Param('id') id: string,
  ): Promise<ProductResponse> {
    const product = await this.productService.findByIdPublic(id);
    return ProductMapper.toProductResponse(product);
  }

  @Patch(':id/variants/:sku/stock')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateVariantStock(
    @Param('id') id: string,
    @Param('sku') sku: string,
    @Body('stock') stock: number,
  ): Promise<ProductResponse> {
    const product = await this.productService.updateVariantStock(
      id,
      sku,
      stock,
    );
    return ProductMapper.toProductResponse(product);
  }

  @Patch(':id/variants/:sku/increase-stock')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async increaseStock(
    @Param('id') id: string,
    @Param('sku') sku: string,
    @Body('quantity') quantity: number,
  ): Promise<ProductResponse> {
    const product = await this.productService.increaseStock(id, sku, quantity);
    return ProductMapper.toProductResponse(product);
  }

  @Patch(':id/variants/:sku/decrease-stock')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async decreaseStock(
    @Param('id') id: string,
    @Param('sku') sku: string,
    @Body('quantity') quantity: number,
  ): Promise<ProductResponse> {
    const product = await this.productService.decreaseStock(id, sku, quantity);
    return ProductMapper.toProductResponse(product);
  }

  @Post(':id/variants')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async addVariant(
    @Param('id') id: string,
    @Body() addVariantDto: AddVariantDto,
  ): Promise<ProductResponse> {
    const product = await this.productService.addVariant(id, addVariantDto);
    return ProductMapper.toProductResponse(product);
  }

  @Patch(':id/variants/:sku')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateVariant(
    @Param('id') id: string,
    @Param('sku') sku: string,
    @Body() updateVariantDto: UpdateSingleVariantDto,
  ): Promise<ProductResponse> {
    const product = await this.productService.updateVariant(
      id,
      sku,
      updateVariantDto,
    );
    return ProductMapper.toProductResponse(product);
  }

  @Delete(':id/variants/:sku')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async removeVariant(
    @Param('id') id: string,
    @Param('sku') sku: string,
  ): Promise<ProductResponse> {
    const product = await this.productService.removeVariant(id, sku);
    return ProductMapper.toProductResponse(product);
  }

  /**
   * Upload de imágenes a Cloudinary
   * POST /products/:id/images
   */
  @Post(':id/images')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/^image\/(jpeg|jpg|png|webp)$/)) {
          return callback(
            new BadRequestException(
              'Solo se permiten imágenes (JPEG, PNG, WebP)',
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadImages(
    @Param('id') productId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<UploadImagesResponseDto> {
    const product = await this.productService.uploadImages(productId, files);

    return {
      id: product.id,
      images: product.images || [],
      message: `${files.length} imagen(es) subida(s) exitosamente`,
    };
  }

  /**
   * Eliminar imagen de un producto
   * DELETE /products/:id/images/:index
   */
  @Delete(':id/images/:index')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteImage(
    @Param('id') productId: string,
    @Param('index') index: string,
  ): Promise<ProductResponse> {
    const imageIndex = parseInt(index, 10);

    if (isNaN(imageIndex)) {
      throw new BadRequestException('Índice de imagen inválido');
    }

    const product = await this.productService.deleteImage(
      productId,
      imageIndex,
    );
    return ProductMapper.toProductResponse(product);
  }

  /**
   * Establecer imagen destacada/portada de un producto
   * PATCH /products/:id/featured-image
   */
  @Patch(':id/featured-image')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async setFeaturedImage(
    @Param('id') productId: string,
    @Body() setFeaturedImageDto: SetFeaturedImageDto,
  ): Promise<ProductResponse> {
    const product = await this.productService.setFeaturedImage(
      productId,
      setFeaturedImageDto.index,
    );
    return ProductMapper.toProductResponse(product);
  }
}
