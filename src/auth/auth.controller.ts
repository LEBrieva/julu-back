import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { JwtAuthGuard } from 'src/commons/guards/jwt-auth.guard';
import { Public } from 'src/commons/decorators/public.decorator';
import type { LoginResponse, RefreshTokenResponse } from 'src/user/interfaces/user.interface';
import type { JwtUser } from 'src/commons/interfaces/jwt.interface';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto, 
    @Request() req: { headers: Record<string, string>; ip: string; connection: { remoteAddress: string } }
  ): Promise<LoginResponse> {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    return this.authService.login(loginDto, userAgent, ipAddress);
  }

  @Public()
  @Post('dashboard/login')
  @HttpCode(HttpStatus.OK)
  async dashboardLogin(
    @Body() loginDto: LoginDto, 
    @Request() req: { headers: Record<string, string>; ip: string; connection: { remoteAddress: string } }
  ): Promise<LoginResponse> {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    return this.authService.login(
      { ...loginDto, isDashboard: true },
      userAgent,
      ipAddress,
    );
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponse> {
    return this.authService.refreshAccessToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() refreshTokenDto: RefreshTokenDto): Promise<void> {
    await this.authService.logout(refreshTokenDto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req: { user: JwtUser }): JwtUser {
    return req.user;
  }
}