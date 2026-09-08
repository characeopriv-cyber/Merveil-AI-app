import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { MachineModule } from '../machine/machine.module';
import { CommandModule } from '../command/command.module';
import { FleetController } from './fleet.controller';
import { FleetService } from './fleet.service';

@Module({
  imports: [PersistenceModule, MachineModule, CommandModule],
  controllers: [FleetController],
  providers: [FleetService],
  exports: [FleetService],
})
export class FleetModule {}
