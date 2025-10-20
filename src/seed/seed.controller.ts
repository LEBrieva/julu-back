import { Controller, Post, Get } from '@nestjs/common';
import { SeedService } from './seed.service';
import { Public } from '../commons/decorators/public.decorator';

@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  @Public() // Permitir acceso sin autenticación para facilitar testing
  async seed() {
    const result = await this.seedService.seedAll();
    return {
      message: 'Base de datos poblada exitosamente',
      data: result,
    };
  }

  @Get()
  @Public() // Endpoint GET para facilitar testing desde navegador
  async seedFromBrowser() {
    const result = await this.seedService.seedAll();
    return {
      message: 'Base de datos poblada exitosamente',
      data: result,
    };
  }
}
