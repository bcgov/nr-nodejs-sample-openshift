import { Controller, Get, Version } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { IntentionService } from './intention.service'
import { IntentionSearchResultDto } from './dto/intention.dto'

@ApiTags('intention')
@Controller('intention')
export class IntentionController {
  constructor(private readonly intentionService: IntentionService) {}

  @Get()
  @Version('1')
  @ApiOkResponse({ type: IntentionSearchResultDto })
  getLatest(): Promise<IntentionSearchResultDto> {
    return this.intentionService.searchLatestInstall()
  }
}
