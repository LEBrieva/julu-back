import { PaginatedResponse } from 'src/commons/interfaces/pagination.interface';

export interface FilterProductResponse {
  id: string;
  name: string;
  basePrice: number;
  status: string;
  category?: string;
  totalVariants: number;
  totalStock: number;
  images?: string[];
}

export interface FilterProductsPaginatedResponse extends PaginatedResponse<FilterProductResponse> {}