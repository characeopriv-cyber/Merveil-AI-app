import { Module } from '@nestjs/common';
import { MachineModule } from './machine/machine.module';
import { CommandModule } from './command/command.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { AuditModule } from './audit/audit.module';
import { EmergencyStopModule } from './safety/emergency-stop.module';

@Module({ imports: [MachineModule, CommandModule, TelemetryModule, AuditModule, EmergencyStopModule] })
export class AppModule {}
