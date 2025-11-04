import { ProductStatus, ProductCategory, ProductStyle } from '../product.enum';

export interface VariantResponse {
  sku: string;
  size: string;
  color: string;
  stock: number;
  price: number;
}

export interface ProductResponse {
  id: string;
  code: string;
  name: string;
  description?: string;
  basePrice: number;
  images?: string[];
  featuredImageIndex?: number;
  variants: VariantResponse[];
  status: ProductStatus;
  category: ProductCategory;
  style: ProductStyle;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}
