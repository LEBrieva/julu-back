import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../user/user.service';
import { LoginDto } from './dtos/login.dto';
import { RefreshToken, RefreshTokenDocument } from './auth.schema';
import { UserDocument } from '../user/user.schema';
import { UserRole, UserStatus } from '../user/user.enum';
import {
  ValidatedUser,
  LoginResponse,
  JwtPayload,
  RefreshTokenResponse,
  PopulatedRefreshToken,
} from 'src/user/interfaces/user.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<ValidatedUser | null> {
    const user: UserDocument | null =
      await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...result } = user.toObject();
      return result as ValidatedUser;
    }
    return null;
  }

  async login(
    loginDto: LoginDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<LoginResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new ForbiddenException('Account is not active');
    }

    // Para dashboard, verificar que tenga permisos administrativos
    if (loginDto.isDashboard && !['admin', 'manager'].includes(user.role)) {
      throw new ForbiddenException(
        'Insufficient permissions for dashboard access',
      );
    }

    const payload: JwtPayload = {
      sub: user._id,
      email: user.email,
      role: user.role,
      permissions: this.getUserPermissions(user.role),
      isDashboard: loginDto.isDashboard || false,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(
      user._id,
      userAgent,
      ipAddress,
    );

    // Actualizar último login
    await this.usersService.updateLastLogin(user._id);

    return {
      accessToken,
      refreshToken: refreshToken.token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<RefreshTokenResponse> {
    const tokenDoc = await this.refreshTokenModel
      .findOne({ token: refreshToken, isRevoked: false })
      .populate('userId')
      .exec();

    if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Aquí necesitamos hacer type assertion porque populate devuelve unknown
    const populatedToken = tokenDoc as unknown as PopulatedRefreshToken;
    const user = populatedToken.userId;

    const payload: JwtPayload = {
      sub: user._id,
      email: user.email,
      role: user.role,
      permissions: this.getUserPermissions(user.role),
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokenModel.updateOne(
      { token: refreshToken },
      { isRevoked: true },
    );
  }

  async logoutAll(userId: string): Promise<void> {
    await this.refreshTokenModel.updateMany({ userId }, { isRevoked: true });
  }

  /**
   * Crea un nuevo usuario en el sistema
   * @param registerDto Datos del usuario a crear
   * @returns Usuario creado (sin password)
   * @throws ConflictException si el email ya está registrado
   */
  async createUser(registerDto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<UserDocument> {
    // 1. Verificar email único
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // 2. Hashear password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // 3. Crear usuario (delegando a UsersService)
    const user = await this.usersService.create({
      email: registerDto.email,
      password: hashedPassword,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phone: registerDto.phone,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    });

    return user;
  }

  private async generateRefreshToken(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<RefreshTokenDocument> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

    return this.refreshTokenModel.create({
      token,
      userId,
      expiresAt,
      userAgent,
      ipAddress,
    });
  }

  /**
   * Actualiza información del perfil del usuario
   * Solo permite actualizar firstName, lastName y phone
   */
  async updateProfile(
    userId: string,
    updateData: { firstName?: string; lastName?: string; phone?: string },
  ): Promise<UserDocument> {
    // Actualizar directamente usando UsersService
    const updatedUser = await this.usersService.update(userId, updateData);

    // Obtener el UserDocument completo desde la BD
    const userDocument = await this.usersService.findByEmail(updatedUser.email);

    if (!userDocument) {
      throw new NotFoundException('User not found after update');
    }

    return userDocument;
  }

  /**
   * Cambia la contraseña del usuario
   * Valida password actual y luego actualiza a nueva contraseña
   * Invalida todos los refresh tokens del usuario (fuerza re-login en todos los dispositivos)
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    // 1. Obtener usuario con password (findByEmail retorna UserDocument completo)
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Obtener usuario completo con password desde findByEmail
    const userWithPassword = await this.usersService.findByEmail(user.email);
    if (!userWithPassword) {
      throw new NotFoundException('User not found');
    }

    // 2. Validar password actual
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      userWithPassword.password,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // 3. Validar que la nueva contraseña sea diferente
    const isSamePassword = await bcrypt.compare(
      newPassword,
      userWithPassword.password,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // 4. Hashear nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 5. Actualizar contraseña
    await this.usersService.update(userId, { password: hashedNewPassword });

    // 6. Invalidar TODOS los refresh tokens del usuario (forzar re-login en todos los dispositivos)
    await this.logoutAll(userId);
  }

  private getUserPermissions(role: UserRole): string[] {
    const permissions: Record<UserRole, string[]> = {
      [UserRole.ADMIN]: ['users:read', 'users:write', 'users:delete'],
      [UserRole.USER]: ['profile:read', 'profile:write'],
    };

    return permissions[role] || permissions[UserRole.USER];
  }
}
