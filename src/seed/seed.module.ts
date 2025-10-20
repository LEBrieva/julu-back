import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { User, UserSchema } from '../user/user.schema';
import { Product, ProductSchema } from '../product/schemas/product.schema';
import { Address, AddressSchema } from '../address/address.schema';
import { Order, OrderSchema } from '../order/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Address.name, schema: AddressSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [SeedController],
  providers: [SeedService],
})
export class SeedModule {}
