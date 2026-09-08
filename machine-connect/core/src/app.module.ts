import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { MachineModule } from './machine/machine.module';
import { CommandModule } from './command/command.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { AuditModule } from './audit/audit.module';
import { EmergencyStopModule } from './safety/emergency-stop.module';
import { OffensiveSecurityModule } from './security/offensive-security.module';
import { RemediationModule } from './security/remediation.module';
import { SecurityModule } from './security/security.module';
import { AdvancedModule } from './advanced/advanced.module';
import { WorkflowModule } from './workflow/workflow.module';
import { ServiceRequestModule } from './service-request/service-request.module';
import { AuthMiddleware } from './auth/auth.middleware';
import { MachineCredentialsModule } from './auth/machine-credentials.module';
import { RealtimeModule } from './persistence/realtime.module';
import { SyncModule } from './sync/sync.module';
import { HealthController } from './health/health.controller';
import { AdaptersModule } from './adapters/adapters.module';
import { GraphModule } from './graph/graph.module';
import { AdvancedAnalyticsModule } from './graph/advanced-analytics.module';
import { DocumentModule } from './graph/document.module';
import { DocumentEntityModule } from './graph/document-entity.module';
import { ComplianceModule } from './compliance/compliance.module';
import { SecurityEventModule } from './security/security-event.module';
import { ApiKeyModule } from './security/api-key.module';
import { RateLimitMiddleware } from './security/rate-limit.middleware';
import { ConnectorModule } from './connectors/connector.module';
import { IntelligenceModule } from './intelligence/intelligence.module';
import { TwinModule } from './twin/twin.module';
import { OperationsModule } from './operations/operations.module';
import { FleetModule } from './fleet/fleet.module';

@Module({
  imports: [AdaptersModule, MachineCredentialsModule, MachineModule, CommandModule, TelemetryModule, AuditModule, EmergencyStopModule, OffensiveSecurityModule, RemediationModule, SecurityModule, AdvancedModule, WorkflowModule, ServiceRequestModule, RealtimeModule, SyncModule, GraphModule, AdvancedAnalyticsModule, DocumentModule, DocumentEntityModule, ComplianceModule, SecurityEventModule, ApiKeyModule, ConnectorModule, IntelligenceModule, TwinModule, OperationsModule, FleetModule],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware, RateLimitMiddleware).forRoutes({ path: 'api/(.*)', method: RequestMethod.ALL });
  }
}
