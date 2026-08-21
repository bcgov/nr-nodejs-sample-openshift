import type { NestExpressApplication } from '@nestjs/platform-express'
import { bootstrap } from './app'
import { Logger } from '@nestjs/common'
import { access } from 'node:fs/promises'

const logger = new Logger('NestApplication')
const secretFile = process.env.VAULT_SECRETS_FILE ?? '/vault/secrets/app.json'

async function waitForVaultSecrets(
  file: string,
  timeoutMs = 60000,
  intervalMs = 1000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs

  while (true) {
    try {
      await access(file)
      logger.log(`Vault secrets file ready at ${file}`)
      return
    } catch {
      if (Date.now() >= deadline) {
        throw new Error(`Vault secrets file not found at ${file} after ${timeoutMs}ms`)
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }
  }
}

waitForVaultSecrets(secretFile)
  .then(() => bootstrap())
  .then(async (app: NestExpressApplication) => {
    await app.listen(3000)
    logger.log(`Listening on ${await app.getUrl()}`)
    logger.log(`Process start up took ${process.uptime()} seconds`)
  })
  .catch((err) => {
    logger.error(`Application startup failed: ${(err as Error).message}`)
    process.exit(1)
  })
