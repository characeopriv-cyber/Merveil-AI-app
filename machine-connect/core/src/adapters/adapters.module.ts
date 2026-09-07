import { Global, Module } from '@nestjs/common';
import { AdapterRegistry } from './adapter-registry';
import { ReferenceSimulatorAdapter } from './reference-simulator.adapter';

@Global()
@Module({
  providers: [AdapterRegistry, ReferenceSimulatorAdapter],
  exports: [AdapterRegistry, ReferenceSimulatorAdapter],
})
export class AdaptersModule {}
