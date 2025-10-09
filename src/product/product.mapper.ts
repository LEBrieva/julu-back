import { PaginationMeta } from "src/commons/interfaces/pagination.interface";
import { FilterProductResponse, FilterProductsPaginatedResponse } from "./dtos/filter-product.response";
import { ProductDocument } from "./schemas/product.schema";
import { ProductResponse } from "./dtos/product.response";

export class ProductMapper {
  static toProductResponse(product: ProductDocument): ProductResponse {
    return {
      id: String(product._id),
      name: product.name,
      code: product.code,
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

  static toFilterListResponse(products: ProductDocument[], pagination: PaginationMeta): FilterProductsPaginatedResponse {
    return {
      data: products.map(product => this.toFilterResponse(product)),
      pagination,
    };
  }
}