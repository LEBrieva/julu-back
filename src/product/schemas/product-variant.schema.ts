import { Prop, Schema } from "@nestjs/mongoose";
import { ProductSize, ProductColor } from "../product.enum";

@Schema({ _id: false })
export class ProductVariant {
  @Prop({ required: true, enum: ProductSize })
  size: ProductSize;

  @Prop({ required: true, enum: ProductColor })
  color: ProductColor;

  @Prop({ required: true, min: 0 })
  stock: number;

  @Prop({ required: true, min: 0 })
  price: number; // Puede variar por variante

  @Prop() 
  sku?: string; // Código único para esta variante
}
