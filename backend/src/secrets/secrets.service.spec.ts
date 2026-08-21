import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { SecretsService } from './secrets.service'

describe('SecretsService', () => {
  let dir: string
  let file: string

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'vault-secrets-'))
    file = join(dir, 'app.json')
    process.env.VAULT_SECRET_PATH = 'apps/dev/oscar-example/nodejs-sample/sample'
  })

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true })
    delete process.env.VAULT_SECRETS_FILE
    delete process.env.VAULT_SECRET_PATH
  })

  it('reports metadata without exposing values', async () => {
    await writeFile(file, JSON.stringify({ password: 'super-secret', username: 'app' }))
    process.env.VAULT_SECRETS_FILE = file

    const status = await new SecretsService().getStatus()

    expect(status.available).toBe(true)
    expect(status.vaultPath).toBe('apps/dev/oscar-example/nodejs-sample/sample')
    expect(status.renderedAt).not.toBeNull()
    expect(status.secrets.map((s) => s.key)).toEqual(['password', 'username'])
    expect(status.secrets[0]?.length).toBe('super-secret'.length)
    expect(status.secrets[0]?.fingerprint).toHaveLength(8)
    expect(JSON.stringify(status)).not.toContain('super-secret')
  })

  it('reports unavailable when the agent has not rendered the file', async () => {
    process.env.VAULT_SECRETS_FILE = join(dir, 'missing.json')

    const status = await new SecretsService().getStatus()

    expect(status.available).toBe(false)
    expect(status.secrets).toEqual([])
    expect(status.renderedAt).toBeNull()
  })

  it('reports unavailable when the file is not a JSON object', async () => {
    const badFile = join(dir, 'bad.json')
    await writeFile(badFile, '["not", "an", "object"]')
    process.env.VAULT_SECRETS_FILE = badFile

    expect((await new SecretsService().getStatus()).available).toBe(false)
  })
})
