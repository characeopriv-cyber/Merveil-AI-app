import { Injectable } from '@nestjs/common';

@Injectable()
export class MfaPolicyService {
  private readonly sensitivePrefixes = ['/api/machines/', '/api/compliance/', '/api/security/'];

  requiresStepUp(method: string | undefined, path: string | undefined): boolean {
    if (!method || !path) return false;
    const normalized = path.split('?')[0];
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) return false;
    return this.sensitivePrefixes.some((prefix) => normalized.startsWith(prefix));
  }
}
