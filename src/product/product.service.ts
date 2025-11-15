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
import { ProductStatus, ProductCategory } from './product.enum';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private readonly cloudinaryService: CloudinaryService,
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
      // NUEVOS FILTROS AVANZADOS (FASE 8b)
      minPrice,
      maxPrice,
      sortBy = 'newest',
      sizes,
      colors,
      styles,
      destacado,
    } = filterDto;

    const query: any = {
      status: ProductStatus.ACTIVE,
      // HARDCODED: Solo remeras por ahora (FASE 8b)
      category: ProductCategory.REMERA,
    };

    // Filtros básicos (retrocompatibilidad)
    // if (category) query.category = category; // Comentado: hardcoded arriba
    if (tags) query.tags = { $in: tags };
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Filtros de estilos: priorizar array sobre singular
    if (styles && styles.length > 0) {
      query.style = { $in: styles };
    } else if (style) {
      query.style = style;
    }

    // Filtros de tallas: priorizar array sobre singular
    if (sizes && sizes.length > 0) {
      query['variants.size'] = { $in: sizes };
    } else if (size) {
      query['variants.size'] = size;
    }

    // Filtros de colores: priorizar array sobre singular
    if (colors && colors.length > 0) {
      query['variants.color'] = { $in: colors };
    } else if (color) {
      query['variants.color'] = color;
    }

    // Filtro de rango de precios (en variantes)
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceQuery: any = {};
      if (minPrice !== undefined) priceQuery.$gte = minPrice;
      if (maxPrice !== undefined) priceQuery.$lte = maxPrice;
      query['variants.price'] = priceQuery;
    }

    // Filtro de productos destacados
    if (destacado !== undefined) {
      query.destacado = destacado;
    }

    // Ordenamiento dinámico
    const sortOptions: Record<string, any> = {
      newest: { createdAt: -1 },
      price_asc: { basePrice: 1 },
      price_desc: { basePrice: -1 },
      name_asc: { name: 1 },
      name_desc: { name: -1 },
    };
    const sortCriteria = sortOptions[sortBy] || sortOptions.newest;

    // Paginación
    const pageNum = page;
    const limitNum = limit;
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      this.productModel
        .find(query)
        .skip(skip)
        .limit(limitNum)
        .sort(sortCriteria)
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

  /**
   * Obtiene los productos destacados (máximo 12)
   * Solo productos activos y marcados como destacado
   */
  async findDestacados(): Promise<ProductDocument[]> {
    return this.productModel
      .find({
        destacado: true,
        status: ProductStatus.ACTIVE,
      })
      .limit(12)
      .sort({ updatedAt: -1 }) // Más recientemente actualizados primero
      .exec();
  }

  /**
   * Cuenta cuántos productos están marcados como destacados actualmente
   */
  async countDestacados(): Promise<number> {
    return this.productModel.countDocuments({ destacado: true });
  }

  /**
   * Alterna el estado de destacado de un producto
   * Valida que no se supere el límite de 12 productos destacados
   */
  async toggleDestacado(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Si se está activando, verificar el límite
    if (!product.destacado) {
      const currentCount = await this.countDestacados();
      if (currentCount >= 12) {
        throw new BadRequestException(
          'Máximo de productos destacados alcanzado (12). Desactiva otro producto primero.',
        );
      }
    }

    // Toggle del valor actual
    product.destacado = !product.destacado;
    return product.save();
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

  /**
   * Sube imágenes a Cloudinary y actualiza el producto
   * @param productId - ID del producto
   * @param files - Archivos de Multer
   * @returns Producto actualizado
   */
  async uploadImages(
    productId: string,
    files: Express.Multer.File[],
  ): Promise<ProductDocument> {
    // Validar que se enviaron archivos
    if (!files || files.length === 0) {
      throw new BadRequestException('Debes enviar al menos una imagen');
    }

    // Obtener producto
    const product = await this.findById(productId);
    const currentImagesCount = product.images?.length || 0;

    // Validar límite total de 5 imágenes
    if (currentImagesCount + files.length > 5) {
      throw new BadRequestException(
        `El producto ya tiene ${currentImagesCount} imágenes. Máximo permitido: 5. Puedes subir ${5 - currentImagesCount} más.`,
      );
    }

    // Subir cada imagen a Cloudinary
    const uploadPromises = files.map((file) =>
      this.cloudinaryService.uploadImage(
        file,
        `ecommerce/products/${productId}`,
      ),
    );

    const imageUrls = await Promise.all(uploadPromises);

    // Actualizar producto con nuevas URLs
    product.images = [...(product.images || []), ...imageUrls];
    return product.save();
  }

  /**
   * Elimina una imagen del producto (Cloudinary + MongoDB)
   * @param productId - ID del producto
   * @param imageIndex - Índice de la imagen en el array (0-4)
   * @returns Producto actualizado
   */
  async deleteImage(
    productId: string,
    imageIndex: number,
  ): Promise<ProductDocument> {
    // Validar que el índice sea válido
    if (imageIndex < 0) {
      throw new BadRequestException('Índice de imagen inválido');
    }

    // Obtener producto
    const product = await this.findById(productId);

    // Validar que el producto tiene imágenes
    if (!product.images || product.images.length === 0) {
      throw new BadRequestException('El producto no tiene imágenes');
    }

    // Validar que el índice existe
    if (imageIndex >= product.images.length) {
      throw new BadRequestException(
        `Índice ${imageIndex} fuera de rango. El producto tiene ${product.images.length} imágenes`,
      );
    }

    // Extraer public_id de la URL y eliminar de Cloudinary
    const imageUrl = product.images[imageIndex];
    const publicId = this.cloudinaryService.extractPublicId(imageUrl);
    await this.cloudinaryService.deleteImage(publicId);

    // Eliminar URL del array
    product.images.splice(imageIndex, 1);
    return product.save();
  }

  /**
   * Establece la imagen destacada/portada del producto
   * @param productId - ID del producto
   * @param imageIndex - Índice de la imagen a establecer como destacada (0-4)
   * @returns Producto actualizado
   */
  async setFeaturedImage(
    productId: string,
    imageIndex: number,
  ): Promise<ProductDocument> {
    // Validar que el índice sea válido
    if (imageIndex < 0) {
      throw new BadRequestException('Índice de imagen inválido');
    }

    // Obtener producto
    const product = await this.findById(productId);

    // Validar que el producto tiene imágenes
    if (!product.images || product.images.length === 0) {
      throw new BadRequestException('El producto no tiene imágenes');
    }

    // Validar que el índice existe
    if (imageIndex >= product.images.length) {
      throw new BadRequestException(
        `Índice ${imageIndex} fuera de rango. El producto tiene ${product.images.length} imágenes`,
      );
    }

    // Actualizar índice de imagen destacada
    product.featuredImageIndex = imageIndex;
    return product.save();
  }
}
