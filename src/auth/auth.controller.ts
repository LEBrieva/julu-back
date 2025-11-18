import {
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  HttpCode,
  HttpStatus,
  Res,
  UnauthorizedException,
  Body,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { UserRegistrationService } from './user-registration.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { JwtAuthGuard } from 'src/commons/guards/jwt-auth.guard';
import { Public } from 'src/commons/decorators/public.decorator';
import type {
  LoginResponse,
  RefreshTokenResponse,
} from 'src/user/interfaces/user.interface';
import type { JwtUser } from 'src/commons/interfaces/jwt.interface';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from 'src/user/user.service';
import { UserMapper } from 'src/user/user.mapper';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private userRegistrationService: UserRegistrationService,
  ) {}

  @Public()
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 intentos por minuto
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Request()
    req: {
      headers: Record<string, string>;
      ip: string;
      connection: { remoteAddress: string };
    },
    @Res({ passthrough: true }) res: Response,
  ): Promise<Omit<LoginResponse, 'refreshToken'>> {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.connection.remoteAddress;

    const { accessToken, refreshToken, user } = await this.authService.login(
      loginDto,
      userAgent,
      ipAddress,
    );

    // Guardar refresh token en httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      path: '/auth',
    });

    // Solo devolver access token y user (NO refresh token)
    return { accessToken, user };
  }

  @Public()
  @Throttle({ short: { limit: 3, ttl: 60000 } }) // 3 registros por minuto
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    const user =
      await this.userRegistrationService.registerUser(registerDto);

    return {
      user: UserMapper.toResponse(user),
    };
  }

  @Public()
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 intentos por minuto
  @Post('dashboard/login')
  @HttpCode(HttpStatus.OK)
  async dashboardLogin(
    @Body() loginDto: LoginDto,
    @Request()
    req: {
      headers: Record<string, string>;
      ip: string;
      connection: { remoteAddress: string };
    },
    @Res({ passthrough: true }) res: Response,
  ): Promise<Omit<LoginResponse, 'refreshToken'>> {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.connection.remoteAddress;

    const { accessToken, refreshToken, user } = await this.authService.login(
      { ...loginDto, isDashboard: true },
      userAgent,
      ipAddress,
    );

    // Guardar refresh token en httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      path: '/auth',
    });

    return { accessToken, user };
  }

  @Public() // Público porque el access token ya expiró cuando se llama
  @Throttle({ medium: { limit: 10, ttl: 60000 } }) // 10 intentos por minuto
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Request() req: { cookies: Record<string, string> },
  ): Promise<RefreshTokenResponse> {
    // Solo leer de cookie (NO aceptar de body por seguridad)
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    return this.authService.refreshAccessToken(refreshToken);
  }

  @Public() // Público para permitir logout incluso si access token expiró
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Request() req: { cookies: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    // Solo leer de cookie (NO aceptar de body por seguridad)
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    // Limpiar cookie siempre (incluso si no había token)
    res.clearCookie('refreshToken', { path: '/auth' });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: { user: JwtUser }) {
    // Obtener usuario completo desde la BD (incluye avatar, firstName, lastName, etc.)
    const user = await this.usersService.findOne(req.user.userId);
    return UserMapper.toResponse(user);
  }
}
