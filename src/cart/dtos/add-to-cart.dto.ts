import { IsNumber, IsString, Min } from 'class-validator';

export class AddToCartDto {
  @IsString()
  productId: string;

  @IsString()
  variantSKU: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}
