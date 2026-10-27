export interface IntentionSummaryDto {
  id: string
  project?: string
  service?: string
  environment?: string
  packageName?: string
  packageVersion?: string
  buildVersion?: string
  outcome?: string
  start?: string
  end?: string
  user?: string
  eventReason?: string
  eventUrl?: string
}

export interface IntentionSearchResultDto {
  environment: string
  total: number
  latest: IntentionSummaryDto | null
}
