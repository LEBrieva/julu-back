import { PaginationMeta } from "src/commons/interfaces/pagination.interface";
import { CreateProductResponse } from "./output/create-product.response";
import { FilterProductResponse, FilterProductsPaginatedResponse } from "./output/filter-product.response";
import { ProductDocument } from "./schemas/product.schema";

export class ProductMapper {
  static toCreateResponse(product: ProductDocument): CreateProductResponse {
    return {
      id: String(product._id),
      name: product.name,
    };
  }

  static toListResponse(products: ProductDocument[]) {
    return products.map(product => this.toCreateResponse(product));
  }

  static toSummary(product: ProductDocument) {
    return {
      id: String(product._id),
      name: product.name,
      basePrice: product.basePrice,
      status: product.status,
      totalVariants: product.variants.length,
      totalStock: product.variants.reduce((sum, v) => sum + v.stock, 0),
    };
  }

  static toFilterResponse(product: ProductDocument): FilterProductResponse {
    return {
      id: String(product._id),
      name: product.name,
      basePrice: product.basePrice,
      status: product.status,
      category: product.category,
      totalVariants: product.variants.length,
      totalStock: product.variants.reduce((sum, v) => sum + v.stock, 0),
      images: product.images,
    };
  }

  static toFilterListResponse(products: ProductDocument[], pagination: PaginationMeta): FilterProductsPaginatedResponse {
    return {
      data: products.map(product => this.toFilterResponse(product)),
      pagination,
    };
  }
}