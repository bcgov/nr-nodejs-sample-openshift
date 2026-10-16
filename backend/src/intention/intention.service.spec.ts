import { BadGatewayException, ServiceUnavailableException } from '@nestjs/common'
import type { VaultService } from '../vault/vault.service'
import { IntentionService } from './intention.service'

describe('IntentionService', () => {
    const secrets = (token?: string) =>
        ({ getSecret: vi.fn().mockResolvedValue(token) }) as unknown as VaultService

    beforeAll(() => {
        process.env.BROKER_BASE_URL = 'https://broker.example/api/'
        process.env.BROKER_PROJECT_NAME = 'proj'
        process.env.BROKER_SERVICE_NAME = 'svc'
        process.env.BROKER_ENVIRONMENT = 'development'
    })

    afterEach(() => vi.unstubAllGlobals())

    afterAll(() => {
        delete process.env.BROKER_BASE_URL
        delete process.env.BROKER_PROJECT_NAME
        delete process.env.BROKER_SERVICE_NAME
        delete process.env.BROKER_ENVIRONMENT
    })

    it('queries the API with the Vault token and returns a whitelisted summary', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                data: [
                    {
                        id: 'abc',
                        transaction: { outcome: 'success', start: 's', end: 'e', token: 'secret-tx' },
                        actions: [
                            {
                                action: 'package-installation',
                                service: { project: 'proj', name: 'svc', environment: 'development' },
                                package: { name: 'pkg', version: '1.2.3' },
                            },
                        ],
                    },
                ],
                meta: { total: 7 },
            }),
        })
        vi.stubGlobal('fetch', fetchMock)

        const result = await new IntentionService(secrets('tok')).searchLatestInstall()

        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
        const parsed = new URL(url)
        expect(parsed.origin + parsed.pathname).toBe('https://broker.example/api/v1/intention/search')
        expect(JSON.parse(parsed.searchParams.get('where')!)).toEqual({
            'actions.action': 'package-installation',
            'actions.service.project': 'proj',
            'actions.service.name': 'svc',
            'actions.service.environment': 'development',
        })
        expect(parsed.searchParams.get('limit')).toBe('1')
        expect(init.method).toBe('POST')
        expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok')
        expect(result.total).toBe(7)
        expect(result.latest).toMatchObject({ id: 'abc', packageVersion: '1.2.3', outcome: 'success' })
        expect(JSON.stringify(result)).not.toContain('secret-tx')
    })

    it('throws 503 when the token is not available in Vault', async () => {
        await expect(new IntentionService(secrets(undefined)).searchLatestInstall()).rejects.toThrow(
            ServiceUnavailableException,
        )
    })

    it('throws 502 when the API call fails', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))
        await expect(new IntentionService(secrets('tok')).searchLatestInstall()).rejects.toThrow(
            BadGatewayException,
        )
    })
})
