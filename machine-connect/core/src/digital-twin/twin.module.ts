import { Module } from '@nestjs/common';
import { TwinService } from './twin.service';

@Module({ providers: [TwinService], exports: [TwinService] })
export class TwinModule {}
