import { ApiProperty } from '@nestjs/swagger'

export class SecretMetadataDto {
  @ApiProperty({ description: 'Key name as stored in Vault' })
  key!: string

  @ApiProperty({ description: 'Character length of the value' })
  length!: number

  @ApiProperty({ description: 'First 8 hex chars of the SHA-256 of the value' })
  fingerprint!: string
}

export class SecretsStatusDto {
  @ApiProperty({ description: 'Whether the Vault Agent has rendered the secrets file' })
  available!: boolean

  @ApiProperty({ description: 'Vault KV path the agent is templating from' })
  vaultPath!: string

  @ApiProperty({ description: 'Path of the rendered file inside the pod' })
  file!: string

  @ApiProperty({ description: 'Last render time', nullable: true })
  renderedAt!: string | null

  @ApiProperty({ type: [SecretMetadataDto], description: 'Metadata only, never values' })
  secrets!: SecretMetadataDto[]
}
