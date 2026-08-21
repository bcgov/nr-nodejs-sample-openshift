export default interface SecretMetadataDto {
    key: string
    length: number
    fingerprint: string
}

export interface SecretsStatusDto {
    available: boolean
    vaultPath: string
    file: string
    renderedAt: string | null
    secrets: SecretMetadataDto[]
}
