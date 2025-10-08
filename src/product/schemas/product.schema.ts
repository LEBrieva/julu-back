import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ProductVariant } from "./product-variant.schema";
import { ProductStatus } from "../product.enum";
import { Document } from 'mongoose'; // 👈 ESTA LÍNEA FALTA

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product { 
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, min: 0 })
    basePrice: number;

    @Prop()
    description?: string;

    @Prop([String])
    images?: string[];

    @Prop({ type: [ProductVariant], required: true })
    variants: ProductVariant[];

    @Prop({ enum: ProductStatus, default: ProductStatus.ACTIVE })
    status: ProductStatus;

    @Prop()
    category?: string;

    @Prop([String])
    tags?: string[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);
export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);

ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ status: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ 'variants.size': 1 });
ProductSchema.index({ 'variants.color': 1 });