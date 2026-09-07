export type SecuritySeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type SecurityEventType =
  | 'intrusion'
  | 'malware'
  | 'anomaly'
  | 'login_failure'
  | 'vulnerability'
  | 'policy_violation'
  | 'authentication'
  | 'other';

export interface SecurityEvent {
  id: string;
  tenantId: string;
  machineId?: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  source: string;
  sourceIp?: string;
  destinationIp?: string;
  eventKey?: string;
  occurredAt: string;
  details: Record<string, unknown>;
}

export interface SecurityAlert {
  id: string;
  tenantId: string;
  type: string;
  severity: SecuritySeverity;
  title: string;
  details: Record<string, unknown>;
  sourceEventIds: string[];
  createdAt: string;
}
