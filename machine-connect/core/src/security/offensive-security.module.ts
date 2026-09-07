import { Module } from '@nestjs/common';
import { OffensiveSecurityController } from './offensive-security.controller';
import { OffensiveSecurityService } from './offensive-security.service';

@Module({
  controllers: [OffensiveSecurityController],
  providers: [OffensiveSecurityService],
  exports: [OffensiveSecurityService],
})
export class OffensiveSecurityModule {}
