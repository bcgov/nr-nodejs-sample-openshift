import { Controller, Get } from '@nestjs/common'

@Controller('health')
export class HealthController {
  @Get()
  check() {
    // Intentionally independent of Vault: a render failure should show up on
    // /api/v1/secrets rather than silently pulling the pod out of rotation.
    return { status: 'ok', uptime: process.uptime() }
  }
}
