import { VaultService } from './vault.service'

const json = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response

describe('VaultService', () => {
  beforeEach(() => {
    process.env.VAULT_ADDR = 'https://vault.example/'
    process.env.VAULT_AUTH_PATH = 'auth/approle'
    process.env.VAULT_MOUNT = 'apps'
    process.env.VAULT_SECRET_PATH = 'dev/proj/svc'
    process.env.VAULT_ROLE_ID = 'role'
    process.env.VAULT_SECRET_ID = 'secret'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    for (const k of [
      'VAULT_ADDR',
      'VAULT_AUTH_PATH',
      'VAULT_MOUNT',
      'VAULT_SECRET_PATH',
      'VAULT_ROLE_ID',
      'VAULT_SECRET_ID',
    ]) {
      delete process.env[k]
    }
  })

  it('logs in with AppRole, reads KV v2 and caches the token', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(200, { auth: { client_token: 'tkn', lease_duration: 3600 } }))
      .mockResolvedValue(json(200, { data: { data: { apitoken: 'abc' } } }))
    vi.stubGlobal('fetch', fetchMock)

    const vault = new VaultService()
    expect(await vault.getSecret('apitoken')).toBe('abc')
    expect(await vault.getSecret('missing')).toBeUndefined()

    expect(fetchMock).toHaveBeenCalledTimes(3)
    const [loginUrl, loginInit] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(loginUrl).toBe('https://vault.example/v1/auth/approle/login')
    expect(JSON.parse(loginInit.body as string)).toEqual({ role_id: 'role', secret_id: 'secret' })
    const [readUrl, readInit] = fetchMock.mock.calls[1] as [string, RequestInit]
    expect(readUrl).toBe('https://vault.example/v1/apps/data/dev/proj/svc')
    expect((readInit.headers as Record<string, string>)['X-Vault-Token']).toBe('tkn')
  })

  it('re-logs in once when the token is rejected', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(200, { auth: { client_token: 'old', lease_duration: 3600 } }))
      .mockResolvedValueOnce(json(403, {}))
      .mockResolvedValueOnce(json(200, { auth: { client_token: 'new', lease_duration: 3600 } }))
      .mockResolvedValueOnce(json(200, { data: { data: { apitoken: 'abc' } } }))
    vi.stubGlobal('fetch', fetchMock)

    expect(await new VaultService().getSecret('apitoken')).toBe('abc')
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it('fails when AppRole credentials are missing', async () => {
    delete process.env.VAULT_SECRET_ID
    vi.stubGlobal('fetch', vi.fn())
    await expect(new VaultService().getSecret('apitoken')).rejects.toThrow(/VAULT_SECRET_ID/)
  })
})
