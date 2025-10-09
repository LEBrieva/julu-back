import { ConflictException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Product, ProductDocument } from "./schemas/product.schema";
import { Model } from "mongoose";
import { CreateProductDto } from "./dtos/create-product.dto";
import { FilterProductDto } from "./dtos/filter-product.dto";


@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}


    async create(createProductDto: CreateProductDto): Promise<ProductDocument> {
        const existingProduct = await this.productModel.findOne({ name: createProductDto.name });

        if (existingProduct) {
            throw new ConflictException('Product with this name already exists');
        }

        const createdProduct = new this.productModel(createProductDto);
        return createdProduct.save();
    }

    async findAll(filterDto: FilterProductDto) {
        const { category, status, tags, size, color, search, page = 1, limit = 10 } = filterDto;

        const query: any = {};
        
        if (category) query.category = category;
        if (status) query.status = status;
        if (tags) query.tags = { $in: tags };
        if (size) query['variants.size'] = size;
        if (color) query['variants.color'] = color;
        if (search) {
          query.$or = [
            { name: { $regex: search, $options: 'i' } },
          ];
        }
    
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
}