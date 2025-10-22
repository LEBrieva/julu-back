import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../user/user.schema';
import { Product } from '../product/schemas/product.schema';
import { Address } from '../address/address.schema';
import { Order } from '../order/order.schema';
import { UserRole, UserStatus } from '../user/user.enum';
import {
  ProductCategory,
  ProductStatus,
  ProductStyle,
} from '../product/product.enum';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../order/order.enum';

@Injectable()
export class SeedService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Address.name) private addressModel: Model<Address>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
  ) {}

  async seedAll() {
    console.log('🌱 Iniciando seed de base de datos...');

    // Limpiar datos existentes
    await this.clearDatabase();

    // Crear datos en orden
    const users = await this.seedUsers();
    const products = await this.seedProducts();
    const addresses = await this.seedAddresses(users);
    const orders = await this.seedOrders(users, products, addresses);

    console.log('✅ Seed completado exitosamente!');
    console.log(`   - ${users.length} usuarios creados`);
    console.log(`   - ${products.length} productos creados`);
    console.log(`   - ${addresses.length} direcciones creadas`);
    console.log(`   - ${orders.length} órdenes creadas`);

    return {
      users: users.length,
      products: products.length,
      addresses: addresses.length,
      orders: orders.length,
    };
  }

  private async clearDatabase() {
    console.log('🗑️  Limpiando base de datos...');
    await this.orderModel.deleteMany({});
    await this.addressModel.deleteMany({});
    await this.productModel.deleteMany({});
    await this.userModel.deleteMany({});
  }

  private async seedUsers() {
    console.log('👥 Creando usuarios...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const usersData = [
      {
        email: 'admin@ecommerce.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Sistema',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
      {
        email: 'user1@example.com',
        password: hashedPassword,
        firstName: 'João',
        lastName: 'Silva',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
      {
        email: 'user2@example.com',
        password: hashedPassword,
        firstName: 'Maria',
        lastName: 'Santos',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
      {
        email: 'user3@example.com',
        password: hashedPassword,
        firstName: 'Pedro',
        lastName: 'Oliveira',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
      {
        email: 'user4@example.com',
        password: hashedPassword,
        firstName: 'Ana',
        lastName: 'Costa',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    ];

    return await this.userModel.insertMany(usersData);
  }

  private async seedProducts() {
    console.log('📦 Creando productos...');

    const productsData = [
      // Remeras
      {
        code: 'REM-OVS-001',
        name: 'Remera Oversize Negra',
        description: 'Remera oversize 100% algodón, perfecta para look casual',
        basePrice: 89.9,
        category: ProductCategory.REMERA,
        style: ProductStyle.OVERSIZE,
        status: ProductStatus.ACTIVE,
        images: ['https://via.placeholder.com/400'],
        tags: ['básica', 'casual', 'algodón'],
        variants: [
          {
            sku: 'REM-OVS-001-GG-BLK',
            size: 'GG',
            color: 'black',
            stock: 50,
            price: 89.9,
          },
          {
            sku: 'REM-OVS-001-M-BLK',
            size: 'M',
            color: 'black',
            stock: 75,
            price: 89.9,
          },
          {
            sku: 'REM-OVS-001-G-BLK',
            size: 'G',
            color: 'black',
            stock: 60,
            price: 89.9,
          },
        ],
      },
      {
        code: 'REM-REG-002',
        name: 'Remera Regular Blanca',
        description: 'Remera regular fit, ideal para el día a día',
        basePrice: 69.9,
        category: ProductCategory.REMERA,
        style: ProductStyle.REGULAR,
        status: ProductStatus.ACTIVE,
        images: ['https://via.placeholder.com/400'],
        tags: ['básica', 'blanca'],
        variants: [
          {
            sku: 'REM-REG-002-GG-WHT',
            size: 'GG',
            color: 'white',
            stock: 40,
            price: 69.9,
          },
          {
            sku: 'REM-REG-002-M-WHT',
            size: 'M',
            color: 'white',
            stock: 55,
            price: 69.9,
          },
        ],
      },
      // Chaquetas
      {
        code: 'CHA-CLA-001',
        name: 'Chaqueta Classic Gris',
        description: 'Chaqueta estilo clásico con capucha',
        basePrice: 189.9,
        category: ProductCategory.CHAQUETA,
        style: ProductStyle.CLASSIC,
        status: ProductStatus.ACTIVE,
        images: ['https://via.placeholder.com/400'],
        tags: ['capucha', 'streetwear'],
        variants: [
          {
            sku: 'CHA-CLA-001-M-GRY',
            size: 'M',
            color: 'gray',
            stock: 30,
            price: 189.9,
          },
          {
            sku: 'CHA-CLA-001-G-GRY',
            size: 'G',
            color: 'gray',
            stock: 25,
            price: 189.9,
          },
        ],
      },
      {
        code: 'CHA-CRO-002',
        name: 'Chaqueta Cropped Negra',
        description: 'Chaqueta estilo cropped sin capucha',
        basePrice: 169.9,
        category: ProductCategory.CHAQUETA,
        style: ProductStyle.CROPPED,
        status: ProductStatus.ACTIVE,
        images: ['https://via.placeholder.com/400'],
        tags: ['minimalista', 'sin capucha'],
        variants: [
          {
            sku: 'CHA-CRO-002-GG-BLK',
            size: 'GG',
            color: 'black',
            stock: 20,
            price: 169.9,
          },
          {
            sku: 'CHA-CRO-002-M-BLK',
            size: 'M',
            color: 'black',
            stock: 35,
            price: 169.9,
          },
        ],
      },
      // Pantalones
      {
        code: 'PAN-STR-001',
        name: 'Pantalón Straight Beige',
        description: 'Pantalón straight de algodón',
        basePrice: 159.9,
        category: ProductCategory.PANTALON,
        style: ProductStyle.STRAIGHT,
        status: ProductStatus.ACTIVE,
        images: ['https://via.placeholder.com/400'],
        tags: ['casual', 'algodón'],
        variants: [
          {
            sku: 'PAN-STR-001-M-BLU',
            size: 'M',
            color: 'blue',
            stock: 25,
            price: 159.9,
          },
          {
            sku: 'PAN-STR-001-G-BLU',
            size: 'G',
            color: 'blue',
            stock: 30,
            price: 159.9,
          },
        ],
      },
    ];

    return await this.productModel.insertMany(productsData);
  }

  private async seedAddresses(users: any[]) {
    console.log('📍 Creando direcciones...');

    const addressesData: any[] = [];

    // Usuario 1 - João Silva
    addressesData.push({
      userId: users[1]._id,
      fullName: 'João Silva',
      email: users[1].email,
      street: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
      country: 'Brasil',
      phone: '+55 11 98765-4321',
      isDefault: true,
    });

    // Usuario 2 - Maria Santos
    addressesData.push({
      userId: users[2]._id,
      fullName: 'Maria Santos',
      email: users[2].email,
      street: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-200',
      country: 'Brasil',
      phone: '+55 11 91234-5678',
      isDefault: true,
    });

    // Usuario 3 - Pedro Oliveira
    addressesData.push({
      userId: users[3]._id,
      fullName: 'Pedro Oliveira',
      email: users[3].email,
      street: 'Rua Oscar Freire, 500',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01426-000',
      country: 'Brasil',
      phone: '+55 11 99999-8888',
      isDefault: true,
    });

    // Usuario 4 - Ana Costa
    addressesData.push({
      userId: users[4]._id,
      fullName: 'Ana Costa',
      email: users[4].email,
      street: 'Rua Augusta, 800',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01305-100',
      country: 'Brasil',
      phone: '+55 11 97777-6666',
      isDefault: true,
    });

    return await this.addressModel.insertMany(addressesData);
  }

  private async seedOrders(users: any[], products: any[], addresses: any[]) {
    console.log('🛒 Creando órdenes...');

    const ordersData: any[] = [];
    const statuses = [
      OrderStatus.PENDING,
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
    ];
    const paymentMethods = [
      PaymentMethod.PIX,
      PaymentMethod.CREDIT_CARD,
      PaymentMethod.DEBIT_CARD,
    ];

    let orderCounter = 1;

    // Generar 30 órdenes distribuidas en los últimos 30 días
    for (let i = 0; i < 30; i++) {
      // Usuario aleatorio (excepto admin)
      const userIndex = Math.floor(Math.random() * (users.length - 1)) + 1;
      const user = users[userIndex];
      const address = addresses.find((a) => a.userId.equals(user._id));

      // Fecha aleatoria en los últimos 30 días
      const daysAgo = Math.floor(Math.random() * 30);
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - daysAgo);

      // Estado aleatorio
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      // Estado de pago basado en el estado de la orden
      let paymentStatus: PaymentStatus;
      if (status === OrderStatus.PENDING) {
        paymentStatus = PaymentStatus.PENDING;
      } else if (status === OrderStatus.CANCELLED) {
        paymentStatus = Math.random() > 0.5 ? PaymentStatus.FAILED : PaymentStatus.REFUNDED;
      } else {
        paymentStatus = PaymentStatus.COMPLETED;
      }

      // Productos aleatorios (1-3 productos por orden)
      const itemsCount = Math.floor(Math.random() * 3) + 1;
      const orderItems: any[] = [];
      let subtotal = 0;

      for (let j = 0; j < itemsCount; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const variant = product.variants[Math.floor(Math.random() * product.variants.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const price = variant.price; // Precio directo de la variante
        const itemSubtotal = price * quantity;

        orderItems.push({
          productId: product._id,
          variantSKU: variant.sku,
          productName: product.name,
          productImage: product.images[0],
          variantSize: variant.size,
          variantColor: variant.color,
          quantity,
          price,
          subtotal: itemSubtotal,
        });

        subtotal += itemSubtotal;
      }

      const shippingCost = subtotal > 200 ? 0 : 15.9; // Envío gratis para compras > R$200
      const total = subtotal + shippingCost;

      // Número de orden único
      const year = orderDate.getFullYear();
      const orderNumber = `ORD-${year}-${String(orderCounter).padStart(5, '0')}`;
      orderCounter++;

      ordersData.push({
        orderNumber,
        userId: user._id,
        items: orderItems,
        shippingAddress: {
          fullName: address.fullName,
          email: address.email,
          street: address.street,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
          country: address.country,
          phone: address.phone,
        },
        subtotal,
        shippingCost,
        total,
        status,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        paymentStatus,
        createdAt: orderDate,
        updatedAt: orderDate,
      });
    }

    return await this.orderModel.insertMany(ordersData);
  }
}
