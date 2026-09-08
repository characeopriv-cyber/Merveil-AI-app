import { Body, Controller, Post, Req } from '@nestjs/common';
import { Principal, requirePrincipal } from '../auth/principal';
import { requirePermission } from '../auth/permissions';
import { AssessChrysalisDto, ExecuteChrysalisDto, VerifyChrysalisDto } from './chrysalis.dto';
import { ChrysalisService } from './chrysalis.service';

type RequestWithPrincipal = { user?: Principal };

@Controller('api/chrysalis')
export class ChrysalisController {
  constructor(private readonly chrysalis: ChrysalisService) {}

  @Post('assess')
  assess(@Req() req: RequestWithPrincipal, @Body() dto: AssessChrysalisDto) {
    const principal = requirePermission(req.user, 'device.read');
    return this.chrysalis.assessDevice(dto, principal);
  }

  @Post('upgrade')
  prepareUpgrade(@Req() req: RequestWithPrincipal, @Body() dto: ExecuteChrysalisDto) {
    const principal = requirePermission(req.user, 'device.control');
    return this.chrysalis.executeUpgrade(dto, principal);
  }

  @Post('verify')
  verifyUpgrade(@Req() req: RequestWithPrincipal, @Body() dto: VerifyChrysalisDto) {
    const principal = requirePermission(req.user, 'device.control');
    return this.chrysalis.verifyUpgrade(dto, requirePrincipal(principal));
  }
}
