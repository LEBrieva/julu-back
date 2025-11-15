import { PaginatedResponse } from 'src/commons/interfaces/pagination.interface';

export interface FilterProductResponse {
  id: string;
  name: string;
  code: string;
  description?: string; // FASE 8b: Agregado para modo list view
  basePrice: number;
  status: string;
  category?: string;
  style?: string;
  totalVariants: number;
  totalStock: number;
  tags?: string[];
  destacado?: boolean;
  images?: string[];
  featuredImageIndex?: number;
}

export interface FilterProductsPaginatedResponse
  extends PaginatedResponse<FilterProductResponse> {}
