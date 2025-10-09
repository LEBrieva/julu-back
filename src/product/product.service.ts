import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Product, ProductDocument } from "./schemas/product.schema";
import { Model } from "mongoose";
import { CreateProductDto } from "./dtos/create-product.dto";
import { FilterProductDto } from "./dtos/filter-product.dto";
import { CommonService } from "src/commons/common.service";


@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}


    async create(createProductDto: CreateProductDto): Promise<ProductDocument> {
        const existingProduct = await this.productModel.findOne({ code: createProductDto.code });

        if (existingProduct) {
            throw new ConflictException('Product with this code already exists');
        }

        // Generar SKU único para cada variante
        const variantsWithSku = createProductDto.variants.map(variant => ({
            ...variant,
            sku: CommonService.generateUniqueSku(createProductDto.name, variant.size, variant.color)
        }));

        const createdProduct = new this.productModel({ 
            ...createProductDto, 
            variants: variantsWithSku 
        });
        return createdProduct.save();
    }

    async findAll(filterDto: FilterProductDto) {
        const { category, style, code, status, tags, size, color, search, page = 1, limit = 10 } = filterDto;

        const query: any = {};
        
        if (category) query.category = category;
        if (style) query.style = style;
        if (code) query.code = { $regex: code, $options: 'i' };
        if (status) query.status = status;
        if (tags) query.tags = { $in: tags };
        if (size) query['variants.size'] = size;
        if (color) query['variants.color'] = color;
        if (search) query.name = { $regex: search, $options: 'i' };

        const pageNum = page;
        const limitNum = limit;
        const skip = (pageNum - 1) * limitNum;

        const [products, total] = await Promise.all([
          this.productModel
            .find(query)
            .skip(skip)
            .limit(limitNum)
            .sort({ createdAt: -1 })
            .exec(),
          this.productModel.countDocuments(query),
        ]);
    
        return {
          products,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
          },
        };
    }

    async findById(id: string): Promise<ProductDocument> {
        const product = await this.productModel.findById(id);
        if (!product) {
            throw new NotFoundException('Product not found');
        }
        return product;
    }

    async findByCode(code: string): Promise<ProductDocument> {
        const product = await this.productModel.findOne({ code });
        if (!product) {
            throw new NotFoundException('Product not found');
        }
        return product;
    }
}