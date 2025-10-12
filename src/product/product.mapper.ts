import { PaginationMeta } from 'src/commons/interfaces/pagination.interface';
import {
  FilterProductResponse,
  FilterProductsPaginatedResponse,
} from './dtos/filter-product.response';
import { ProductDocument } from './schemas/product.schema';
import { ProductResponse, VariantResponse } from './dtos/product.response';

export class ProductMapper {
  static toProductResponse(product: ProductDocument): ProductResponse {
    return {
      id: String(product._id),
      code: product.code,
      name: product.name,
      description: product.description,
      basePrice: product.basePrice,
      images: product.images,
      variants: product.variants.map((v) => ({
        sku: v.sku || '',
        size: v.size,
        color: v.color,
        stock: v.stock,
        price: v.price,
      })),
      status: product.status,
      category: product.category,
      style: product.style,
      tags: product.tags,
      createdAt: product.createdAt || new Date(),
      updatedAt: product.updatedAt || new Date(),
    };
  }

  static toFilterResponse(product: ProductDocument): FilterProductResponse {
    return {
      id: String(product._id),
      name: product.name,
      code: product.code,
      basePrice: product.basePrice,
      status: product.status,
      category: product.category,
      style: product.style,
      tags: product.tags,
      totalVariants: product.variants.length,
      totalStock: product.variants.reduce((sum, v) => sum + v.stock, 0),
    };
  }

  static toFilterListResponse(
    products: ProductDocument[],
    pagination: PaginationMeta,
  ): FilterProductsPaginatedResponse {
    return {
      data: products.map((product) => this.toFilterResponse(product)),
      pagination,
    };
  }
}
