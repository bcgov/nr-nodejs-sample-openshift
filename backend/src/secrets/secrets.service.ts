import { Injectable, Logger } from '@nestjs/common'
import { readFile, stat } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import type { SecretsStatusDto } from './dto/secrets-status.dto'

/**
 * Reads the secrets rendered to disk by the Vault Agent sidecar.
 *
 * The agent logs in with the AppRole role_id/secret_id provisioned by the
 * NR Broker cron job and renders the KV v2 payload as JSON. Nothing here talks
 * to Vault directly, so the app never handles the AppRole credentials itself.
 */
@Injectable()
export class SecretsService {
  private readonly logger = new Logger(SecretsService.name)
  private readonly file = process.env.VAULT_SECRETS_FILE ?? '/vault/secrets/app.json'
  private readonly path = process.env.VAULT_SECRET_PATH ?? '(unset)'

  async getStatus(): Promise<SecretsStatusDto> {
    try {
      // Read on every request so rotations rendered by the agent are picked up.
      const [contents, info] = await Promise.all([readFile(this.file, 'utf8'), stat(this.file)])
      const parsed: unknown = JSON.parse(contents)
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new TypeError('secrets file is not a JSON object')
      }

      return {
        available: true,
        vaultPath: this.path,
        file: this.file,
        renderedAt: info.mtime.toISOString(),
        secrets: Object.entries(parsed as Record<string, unknown>)
          .map(([key, value]) => this.describe(key, value))
          .sort((a, b) => a.key.localeCompare(b.key)),
      }
    } catch (error) {
      this.logger.warn(`Unable to read secrets from ${this.file}: ${(error as Error).message}`)
      return {
        available: false,
        vaultPath: this.path,
        file: this.file,
        renderedAt: null,
        secrets: [],
      }
    }
  }

  /**
   * Deliberately returns metadata only; secret values must never leave the pod.
   */
  private describe(key: string, value: unknown) {
    const asString = typeof value === 'string' ? value : JSON.stringify(value ?? '')
    return {
      key,
      length: asString.length,
      fingerprint: createHash('sha256').update(asString).digest('hex').slice(0, 8),
    }
  }
}
