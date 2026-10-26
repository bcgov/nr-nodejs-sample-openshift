import { Module } from '@nestjs/common'
import { VaultModule } from '../vault/vault.module'
import { IntentionController } from './intention.controller'
import { IntentionService } from './intention.service'

@Module({
    imports: [VaultModule],
    controllers: [IntentionController],
    providers: [IntentionService],
})
export class IntentionModule { }
