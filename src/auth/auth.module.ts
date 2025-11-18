import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../user/user.module';
import { OrderModule } from '../order/order.module';
import { AddressModule } from '../address/address.module';
import { AuthController } from './auth.controller';
import { RefreshToken, RefreshTokenSchema } from './auth.schema';
import { AuthService } from './auth.service';
import { UserRegistrationService } from './user-registration.service';
import { JwtStrategy } from 'src/commons/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    OrderModule,
    AddressModule,
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: RefreshToken.name, schema: RefreshTokenSchema },
    ]),
  ],
  providers: [AuthService, UserRegistrationService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
