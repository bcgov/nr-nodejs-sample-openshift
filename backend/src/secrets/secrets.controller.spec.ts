import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'
import { SecretsController } from './secrets.controller'
import { SecretsService } from './secrets.service'

describe('SecretsController', () => {
  let controller: SecretsController
  const status = {
    available: true,
    vaultPath: 'apps/dev/oscar-example/nodejs-sample/sample',
    file: '/vault/secrets/app.json',
    renderedAt: '2026-01-01T00:00:00.000Z',
    secrets: [{ key: 'password', length: 12, fingerprint: 'deadbeef' }],
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SecretsController],
      providers: [
        { provide: SecretsService, useValue: { getStatus: () => Promise.resolve(status) } },
      ],
    }).compile()

    controller = module.get<SecretsController>(SecretsController)
  })

  it('returns the injected secret metadata', async () => {
    await expect(controller.getSecrets()).resolves.toEqual(status)
  })
})
