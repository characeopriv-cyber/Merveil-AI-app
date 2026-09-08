import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { MachineModule } from '../machine/machine.module';
import { CommandModule } from '../command/command.module';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { FleetController } from './fleet.controller';
import { FleetService } from './fleet.service';
import { FleetIntelligenceController } from './fleet-intelligence.controller';
import { FleetIntelligenceService } from './fleet-intelligence.service';

@Module({
  imports: [PersistenceModule, MachineModule, CommandModule, TelemetryModule],
  controllers: [FleetController, FleetIntelligenceController],
  providers: [FleetService, FleetIntelligenceService],
  exports: [FleetService, FleetIntelligenceService],
})
export class FleetModule {}
