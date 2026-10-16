import { Injectable, Logger } from '@nestjs/common'

/**
 * Logs in to Vault with AppRole (role_id/secret_id from the OpenShift secret)
 * and reads values from a KV v2 path.
 */
@Injectable()
export class VaultService {
    private readonly logger = new Logger(VaultService.name)
    private readonly addr = (process.env.VAULT_ADDR ?? 'https://knox.io.nrs.gov.bc.ca').replace(
        /\/+$/,
        '',
    )
    private readonly authPath = process.env.VAULT_AUTH_PATH ?? 'auth/vs_apps_approle'
    private readonly mount = process.env.VAULT_MOUNT ?? 'apps'
    private readonly secretPath = process.env.VAULT_SECRET_PATH ?? ''
    private token?: { value: string; expiresAt: number }

    async getSecret(key: string): Promise<string | undefined> {
        const data = await this.read()
        const value = data[key]
        return typeof value === 'string' && value.length > 0 ? value : undefined
    }

    private async read(): Promise<Record<string, unknown>> {
        const url = `${this.addr}/v1/${this.mount}/data/${this.secretPath}`
        let response = await this.request(url, { headers: { 'X-Vault-Token': await this.login() } })
        if (response.status === 403) {
            // Token revoked or expired early; retry once with a fresh login.
            this.token = undefined
            response = await this.request(url, { headers: { 'X-Vault-Token': await this.login() } })
        }
        if (!response.ok) {
            throw new Error(`Vault read failed: HTTP ${response.status}`)
        }
        const body = (await response.json()) as { data?: { data?: Record<string, unknown> } }
        return body.data?.data ?? {}
    }

    private async login(): Promise<string> {
        if (this.token && Date.now() < this.token.expiresAt) {
            return this.token.value
        }
        const roleId = process.env.VAULT_ROLE_ID
        const secretId = process.env.VAULT_SECRET_ID
        if (!roleId || !secretId) {
            throw new Error('VAULT_ROLE_ID and VAULT_SECRET_ID must be set')
        }

        const response = await this.request(`${this.addr}/v1/${this.authPath}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role_id: roleId, secret_id: secretId }),
        })
        if (!response.ok) {
            throw new Error(`Vault AppRole login failed: HTTP ${response.status}`)
        }
        const body = (await response.json()) as {
            auth?: { client_token?: string; lease_duration?: number }
        }
        const value = body.auth?.client_token
        if (!value) {
            throw new Error('Vault AppRole login returned no token')
        }
        // Renew 30s before the lease ends.
        const ttlMs = Math.max((body.auth?.lease_duration ?? 60) - 30, 0) * 1000
        this.token = { value, expiresAt: Date.now() + ttlMs }
        this.logger.log('Logged in to Vault with AppRole')
        return value
    }

    private request(url: string, init: RequestInit): Promise<Response> {
        return fetch(url, { ...init, signal: AbortSignal.timeout(10_000) })
    }
}
