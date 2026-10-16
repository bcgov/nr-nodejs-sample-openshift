import { Controller, Get } from '@nestjs/common'

@Controller('health')
export class HealthController {
  @Get()
  check() {
    // Intentionally independent of Vault so a Vault outage doesn't pull the pod out of rotation.
    return { status: 'ok', uptime: process.uptime() }
  }
}
