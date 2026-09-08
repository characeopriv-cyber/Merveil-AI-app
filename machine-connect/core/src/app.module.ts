import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { MachineModule } from './machine/machine.module';
import { CommandModule } from './command/command.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { AuditModule } from './audit/audit.module';
import { EmergencyStopModule } from './safety/emergency-stop.module';
import { OffensiveSecurityModule } from './security/offensive-security.module';
import { RemediationModule } from './security/remediation.module';
import { AdvancedModule } from './advanced/advanced.module';
import { WorkflowModule } from './workflow/workflow.module';
import { ServiceRequestModule } from './service-request/service-request.module';
import { AuthMiddleware } from './auth/auth.middleware';
import { MachineCredentialsModule } from './auth/machine-credentials.module';
import { RealtimeModule } from './persistence/realtime.module';
import { SyncModule } from './sync/sync.module';
import { HealthController } from './health/health.controller';
import { AdaptersModule } from './adapters/adapters.module';

@Module({
  imports: [AdaptersModule, MachineCredentialsModule, MachineModule, CommandModule, TelemetryModule, AuditModule, EmergencyStopModule, OffensiveSecurityModule, RemediationModule, AdvancedModule, WorkflowModule, ServiceRequestModule, RealtimeModule, SyncModule],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes({ path: 'api/(.*)', method: RequestMethod.ALL });
  }
}
