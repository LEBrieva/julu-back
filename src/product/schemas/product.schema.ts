import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ProductVariant } from './product-variant.schema';
import { ProductStatus, ProductCategory, ProductStyle } from '../product.enum';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, min: 0 })
  basePrice: number;

  @Prop()
  description?: string;

  @Prop([String])
  images?: string[];

  @Prop({ type: Number, default: 0 })
  featuredImageIndex?: number;

  @Prop({ type: [ProductVariant], required: true })
  variants: ProductVariant[];

  @Prop({ enum: ProductStatus, default: ProductStatus.ACTIVE })
  status: ProductStatus;

  @Prop({ enum: ProductCategory, required: true })
  category: ProductCategory;

  @Prop({ enum: ProductStyle, required: true })
  style: ProductStyle;

  @Prop([String])
  tags?: string[];

  @Prop({ type: Boolean, default: false })
  destacado?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
export const ProductVariantSchema =
  SchemaFactory.createForClass(ProductVariant);

// Índices para filtros
ProductSchema.index({ status: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ style: 1 });
ProductSchema.index({ 'variants.size': 1 });
ProductSchema.index({ 'variants.color': 1 });
ProductSchema.index({ destacado: 1 });

// Índices para búsqueda y queries comunes
ProductSchema.index({ code: 1 });
ProductSchema.index({ name: 1 });
