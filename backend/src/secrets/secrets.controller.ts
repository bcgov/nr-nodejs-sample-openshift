import { Controller, Get, Version } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { SecretsService } from './secrets.service'
import { SecretsStatusDto } from './dto/secrets-status.dto'

@ApiTags('secrets')
@Controller('secrets')
export class SecretsController {
  constructor(private readonly secretsService: SecretsService) {}

  @Get()
  @Version('1')
  @ApiOkResponse({ type: SecretsStatusDto })
  getSecrets(): Promise<SecretsStatusDto> {
    return this.secretsService.getStatus()
  }
}
