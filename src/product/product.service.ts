import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { Model } from 'mongoose';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { FilterProductDto } from './dtos/filter-product.dto';
import { AddVariantDto, UpdateSingleVariantDto } from './dtos/variant.dto';
import { CommonService } from 'src/commons/common.service';
import { ProductStatus } from './product.enum';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<ProductDocument> {
    const existingProduct = await this.productModel.findOne({
      code: createProductDto.code,
    });

    if (existingProduct) {
      throw new ConflictException('Product with this code already exists');
    }

    // Generar SKU único para cada variante
    const variantsWithSku = createProductDto.variants.map((variant) => ({
      ...variant,
      sku: CommonService.generateUniqueSku(
        createProductDto.name,
        variant.size,
        variant.color,
      ),
    }));

    const createdProduct = new this.productModel({
      ...createProductDto,
      variants: variantsWithSku,
    });
    return createdProduct.save();
  }

  async findAll(filterDto: FilterProductDto) {
    const {
      category,
      style,
      code,
      status,
      tags,
      size,
      color,
      search,
      page = 1,
      limit = 10,
    } = filterDto;

    const query: any = {};

    if (category) query.category = category;
    if (style) query.style = style;
    if (code) query.code = { $regex: code, $options: 'i' };
    if (status) query.status = status;
    if (tags) query.tags = { $in: tags };
    if (size) query['variants.size'] = size;
    if (color) query['variants.color'] = color;
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = page;
    const limitNum = limit;
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      this.productModel
        .find(query)
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 })
        .exec(),
      this.productModel.countDocuments(query),
    ]);

      return {
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async findAllActive(filterDto: FilterProductDto) {
    const {
      category,
      style,
      tags,
      size,
      color,
      search,
      page = 1,
      limit = 10,
    } = filterDto;

    const query: any = {
      status: ProductStatus.ACTIVE,
    };

    if (category) query.category = category;
    if (style) query.style = style;
    if (tags) query.tags = { $in: tags };
    if (size) query['variants.size'] = size;
    if (color) query['variants.color'] = color;
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = page;
    const limitNum = limit;
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      this.productModel
        .find(query)
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 })
        .exec(),
      this.productModel.countDocuments(query),
    ]);

    return {
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async findByIdPublic(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findOne({
      _id: id,
      status: ProductStatus.ACTIVE,
    });

    if (!product) {
      throw new NotFoundException('Product not found or not available');
    }

    return product;
  }

  async findById(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async findByCode(code: string): Promise<ProductDocument> {
    const product = await this.productModel.findOne({ code });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductDocument> {
    // Verificar que el producto existe
    const existingProduct = await this.productModel.findById(id);
    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    // Si se está actualizando el code, verificar que no exista otro producto con ese code
    if (
      updateProductDto.code &&
      updateProductDto.code !== existingProduct.code
    ) {
      const productWithCode = await this.productModel.findOne({
        code: updateProductDto.code,
      });
      if (productWithCode) {
        throw new ConflictException('Product with this code already exists');
      }
    }

    // Si se están actualizando variantes, regenerar SKUs
    if (updateProductDto.variants && updateProductDto.variants.length > 0) {
      const productName = updateProductDto.name || existingProduct.name;
      updateProductDto.variants = updateProductDto.variants.map((variant) => {
        // Solo generar SKU si se proporcionan size y color
        if (variant.size && variant.color) {
          return {
            ...variant,
            sku: CommonService.generateUniqueSku(
              productName,
              variant.size,
              variant.color,
            ),
          };
        }
        return variant;
      });
    }

    // Actualizar producto (solo campos enviados)
    const updatedProduct = await this.productModel.findByIdAndUpdate(
      id,
      { $set: updateProductDto },
      { new: true, runValidators: true },
    );

    if (!updatedProduct) {
      throw new NotFoundException('Product not found');
    }

    return updatedProduct;
  }

  async deactivate(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.status === ProductStatus.INACTIVE) {
      throw new ConflictException('Product is already inactive');
    }

    product.status = ProductStatus.INACTIVE;
    return product.save();
  }

  async activate(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.status === ProductStatus.ACTIVE) {
      throw new ConflictException('Product is already active');
    }

    product.status = ProductStatus.ACTIVE;
    return product.save();
  }

  async updateVariantStock(
    productId: string,
    sku: string,
    newStock: number,
  ): Promise<ProductDocument> {
    if (newStock < 0) {
      throw new BadRequestException('Stock cannot be negative');
    }

    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const variant = product.variants.find((v) => v.sku === sku);

    if (!variant) {
      throw new NotFoundException(`Variant with SKU ${sku} not found`);
    }

    variant.stock = newStock;
    return product.save();
  }

  async checkStockAvailability(
    productId: string,
    sku: string,
    quantity: number,
  ): Promise<boolean> {
    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const variant = product.variants.find((v) => v.sku === sku);

    if (!variant) {
      throw new NotFoundException(`Variant with SKU ${sku} not found`);
    }

    return variant.stock >= quantity;
  }

  async decreaseStock(
    productId: string,
    sku: string,
    quantity: number,
  ): Promise<ProductDocument> {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const variant = product.variants.find((v) => v.sku === sku);

    if (!variant) {
      throw new NotFoundException(`Variant with SKU ${sku} not found`);
    }

    if (variant.stock < quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${variant.stock}, Requested: ${quantity}`,
      );
    }

    variant.stock -= quantity;
    return product.save();
  }

  async increaseStock(
    productId: string,
    sku: string,
    quantity: number,
  ): Promise<ProductDocument> {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const variant = product.variants.find((v) => v.sku === sku);

    if (!variant) {
      throw new NotFoundException(`Variant with SKU ${sku} not found`);
    }

    variant.stock += quantity;
    return product.save();
  }

  async addVariant(
    productId: string,
    addVariantDto: AddVariantDto,
  ): Promise<ProductDocument> {
    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Verificar si ya existe una variante con el mismo size y color
    const existingVariant = product.variants.find(
      (v) => v.size === addVariantDto.size && v.color === addVariantDto.color,
    );

    if (existingVariant) {
      throw new ConflictException(
        `Variant with size ${addVariantDto.size} and color ${addVariantDto.color} already exists`,
      );
    }

    // Generar SKU para la nueva variante
    const sku = CommonService.generateUniqueSku(
      product.name,
      addVariantDto.size,
      addVariantDto.color,
    );

    // Agregar la variante
    product.variants.push({
      ...addVariantDto,
      sku,
    } as any);

    return product.save();
  }

  async updateVariant(
    productId: string,
    sku: string,
    updateVariantDto: UpdateSingleVariantDto,
  ): Promise<ProductDocument> {
    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const variant = product.variants.find((v) => v.sku === sku);

    if (!variant) {
      throw new NotFoundException(`Variant with SKU ${sku} not found`);
    }

    // Actualizar solo los campos proporcionados
    if (updateVariantDto.stock !== undefined) {
      variant.stock = updateVariantDto.stock;
    }
    if (updateVariantDto.price !== undefined) {
      variant.price = updateVariantDto.price;
    }

    return product.save();
  }

  async removeVariant(
    productId: string,
    sku: string,
  ): Promise<ProductDocument> {
    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const variantIndex = product.variants.findIndex((v) => v.sku === sku);

    if (variantIndex === -1) {
      throw new NotFoundException(`Variant with SKU ${sku} not found`);
    }

    // Verificar que no sea la última variante
    if (product.variants.length === 1) {
      throw new BadRequestException(
        'Cannot remove the last variant. A product must have at least one variant.',
      );
    }

    product.variants.splice(variantIndex, 1);
    return product.save();
  }
}
