import { Global, Module } from '@nestjs/common';
import { AdapterRegistry } from './adapter-registry';
import { ReferenceSimulatorAdapter } from './reference-simulator.adapter';
import { MqttAdapter } from './mqtt.adapter';
import { MachineCredentialsModule } from '../auth/machine-credentials.module';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { CommandModule } from '../command/command.module';

@Global()
@Module({
  imports: [MachineCredentialsModule, TelemetryModule, CommandModule],
  providers: [AdapterRegistry, ReferenceSimulatorAdapter, MqttAdapter],
  exports: [AdapterRegistry, ReferenceSimulatorAdapter, MqttAdapter],
})
export class AdaptersModule {}
