import { Global, Module } from '@nestjs/common';
import { AdapterRegistry } from './adapter-registry';

@Global()
@Module({ providers: [AdapterRegistry], exports: [AdapterRegistry] })
export class AdaptersModule {}
