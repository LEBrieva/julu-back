import { SetMetadata } from '@nestjs/common';

// Marks a route or controller as publicly accessible (skips JWT auth)
export const Public = () => SetMetadata('isPublic', true);
