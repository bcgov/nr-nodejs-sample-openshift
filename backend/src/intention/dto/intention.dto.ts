import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class IntentionSummaryDto {
  @ApiProperty()
  id!: string

  @ApiPropertyOptional()
  project?: string

  @ApiPropertyOptional()
  service?: string

  @ApiPropertyOptional()
  environment?: string

  @ApiPropertyOptional()
  packageName?: string

  @ApiPropertyOptional()
  packageVersion?: string

  @ApiPropertyOptional()
  buildVersion?: string

  @ApiPropertyOptional()
  outcome?: string

  @ApiPropertyOptional()
  start?: string

  @ApiPropertyOptional()
  end?: string

  @ApiPropertyOptional()
  user?: string

  @ApiPropertyOptional()
  eventReason?: string

  @ApiPropertyOptional()
  eventUrl?: string
}

export class IntentionSearchResultDto {
  @ApiProperty({ description: 'Environment that was queried' })
  environment!: string

  @ApiProperty({ description: 'Total matching intentions reported by the API' })
  total!: number

  @ApiProperty({ type: IntentionSummaryDto, nullable: true })
  latest!: IntentionSummaryDto | null
}
