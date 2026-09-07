import { Module } from '@nestjs/common';
import { MachineModule } from './machine/machine.module';
import { CommandModule } from './command/command.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { AuditModule } from './audit/audit.module';
import { EmergencyStopModule } from './safety/emergency-stop.module';
import { OffensiveSecurityModule } from './security/offensive-security.module';
import { RemediationModule } from './security/remediation.module';
import { AdvancedModule } from './advanced/advanced.module';
import { WorkflowModule } from './workflow/workflow.module';

@Module({
  imports: [MachineModule, CommandModule, TelemetryModule, AuditModule, EmergencyStopModule, OffensiveSecurityModule, RemediationModule, AdvancedModule, WorkflowModule],
})
export class AppModule {}
