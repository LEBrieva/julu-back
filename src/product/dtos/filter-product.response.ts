import { PaginatedResponse } from 'src/commons/interfaces/pagination.interface';

export interface FilterProductResponse {
  id: string;
  name: string;
  code: string;
  basePrice: number;
  status: string;
  category?: string;
  style?: string;
  totalVariants: number;
  totalStock: number;
  tags?: string[];
  destacado?: boolean;
}

export interface FilterProductsPaginatedResponse
  extends PaginatedResponse<FilterProductResponse> {}
