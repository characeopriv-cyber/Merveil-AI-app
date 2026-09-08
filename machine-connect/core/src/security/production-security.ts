import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, timingSafeEqual } from 'node:crypto';

@Injectable()
export class ProductionSecurity {
  requireOrganization(value?: string): string {
    if (!value || !/^[0-9a-fA-F-]{16,64}$/.test(value)) throw new UnauthorizedException('Invalid organization context');
    return value;
  }

  verifyWebhook(secret: string | undefined, provided: string | undefined): boolean {
    if (!secret || !provided) return false;
    const a = createHash('sha256').update(secret).digest();
    const b = createHash('sha256').update(provided).digest();
    return timingSafeEqual(a, b);
  }
}
