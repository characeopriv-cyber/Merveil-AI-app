import { Module } from '@nestjs/common';
import { FleetIntelligenceController } from './fleet-intelligence.controller';
import { FleetIntelligenceService } from './fleet-intelligence.service';
import { PersistenceModule } from '../persistence/persistence.module';
import { MachineModule } from '../machine/machine.module';
import { TelemetryModule } from '../telemetry/telemetry.module';

@Module({
  imports: [PersistenceModule, MachineModule, TelemetryModule],
  controllers: [FleetIntelligenceController],
  providers: [FleetIntelligenceService],
  exports: [FleetIntelligenceService],
})
export class FleetIntelligenceModule {}
