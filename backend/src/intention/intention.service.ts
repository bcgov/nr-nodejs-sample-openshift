import {
    BadGatewayException,
    Injectable,
    Logger,
    ServiceUnavailableException,
} from '@nestjs/common'
import { VaultService } from '../vault/vault.service'
import type { IntentionSearchResultDto, IntentionSummaryDto } from './dto/intention.dto'

type RawIntention = Record<string, any>

@Injectable()
export class IntentionService {
    private readonly logger = new Logger(IntentionService.name)
    private readonly baseUrl = (
        process.env.BROKER_BASE_URL ?? 'https://broker.io.nrs.gov.bc.ca'
    ).replace(/\/+$/, '')
    private readonly projectName = process.env.BROKER_PROJECT_NAME ?? ''
    private readonly serviceName = process.env.BROKER_SERVICE_NAME ?? ''
    private readonly environment = process.env.BROKER_ENVIRONMENT ?? 'development'
    private readonly tokenKey = process.env.BROKER_TOKEN_KEY ?? 'apitoken'

    constructor(private readonly vault: VaultService) { }

    async searchLatestInstall(): Promise<IntentionSearchResultDto> {
        const apitoken = await this.vault.getSecret(this.tokenKey).catch((error: Error) => {
            this.logger.warn(error.message)
            return undefined
        })
        if (!apitoken) {
            throw new ServiceUnavailableException(`Vault secret "${this.tokenKey}" is not available`)
        }

        const where = {
            'actions.action': 'package-installation',
            'actions.service.project': this.projectName,
            'actions.service.name': this.serviceName,
            'actions.service.environment': this.environment,
        }
        const params = new URLSearchParams({
            where: JSON.stringify(where),
            offset: '0',
            limit: '1',
        })
        const requestUrl = `${this.baseUrl}/v1/intention/search?${params.toString()}`

        let body: { data?: RawIntention[]; meta?: { total?: number } }
        try {
            const response = await fetch(requestUrl, {
                method: 'POST',
                body: '',
                headers: {
                    accept: 'application/json',
                    Authorization: `Bearer ${apitoken}`,
                },
                signal: AbortSignal.timeout(10_000),
            })
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }
            body = (await response.json()) as typeof body
        } catch (error) {
            this.logger.warn(`Intention search failed: ${(error as Error).message}`)
            throw new BadGatewayException('Intention search failed')
        }

        const intention = body.data?.[0]
        return {
            environment: this.environment,
            total: body.meta?.total ?? body.data?.length ?? 0,
            latest: intention ? this.summarize(intention) : null,
        }
    }

    // Whitelist fields so tokens/hashes in the intention never reach the browser.
    private summarize(intention: RawIntention): IntentionSummaryDto {
        const action =
            (intention.actions as RawIntention[] | undefined)?.find(
                (a) => a.action === 'package-installation',
            ) ?? {}
        return {
            id: String(intention.id ?? intention._id ?? ''),
            project: action.service?.project,
            service: action.service?.name,
            environment: action.service?.environment,
            packageName: action.package?.name,
            packageVersion: action.package?.version,
            buildVersion: action.package?.buildVersion,
            outcome: intention.transaction?.outcome ?? action.trace?.outcome,
            start: intention.transaction?.start ?? action.trace?.start,
            end: intention.transaction?.end ?? action.trace?.end,
            user: intention.user?.name ?? action.user?.name,
            eventReason: intention.event?.reason,
            eventUrl: intention.event?.url,
        }
    }
}
