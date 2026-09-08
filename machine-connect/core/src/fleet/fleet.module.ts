import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { MachineModule } from '../machine/machine.module';
import { CommandModule } from '../command/command.module';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { FleetController } from './fleet.controller';
import { FleetService } from './fleet.service';
import { FleetIntelligenceController } from './fleet-intelligence.controller';
import { FleetIntelligenceService } from './fleet-intelligence.service';
import { RemediationService } from './remediation.service';
import { RolloutService } from './rollout.service';
import { FleetOperationsController } from './fleet-operations.controller';

@Module({
  imports: [PersistenceModule, MachineModule, CommandModule, TelemetryModule],
  controllers: [FleetController, FleetIntelligenceController, FleetOperationsController],
  providers: [FleetService, FleetIntelligenceService, RemediationService, RolloutService],
  exports: [FleetService, FleetIntelligenceService, RemediationService, RolloutService],
})
export class FleetModule {}
