export type PlatformSecurityEventType = 'authentication' | 'authorization' | 'rate_limit' | 'integrity' | 'dependency' | 'configuration' | 'availability' | 'data_access';
export type PlatformSecuritySeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface PlatformSecurityEvent {
  id: string;
  tenantId?: string;
  service: string;
  type: PlatformSecurityEventType;
  severity: PlatformSecuritySeverity;
  eventKey: string;
  occurredAt: string;
  details: Record<string, unknown>;
}
