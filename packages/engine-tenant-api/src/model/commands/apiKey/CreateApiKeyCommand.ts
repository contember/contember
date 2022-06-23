import { Command } from '../Command.js'
import { ApiKey } from '../../type/index.js'
import { ApiKeyHelper } from './ApiKeyHelper.js'
import { InsertBuilder } from '@contember/database'
import { computeTokenHash, generateToken, TokenHash } from '../../utils/index.js'

interface CreateSessionApiKeyArgs {
	type: ApiKey.Type.SESSION
	identityId: string
	expiration?: number
	tokenHash?: string
}

interface CreatePermanentApiKeyArgs {
	type: ApiKey.Type.PERMANENT
	identityId: string
	tokenHash?: TokenHash
	expiration?: undefined
}

export type CreateApiKeyArgs =
	| CreateSessionApiKeyArgs
	| CreatePermanentApiKeyArgs

export class CreateApiKeyCommand implements Command<CreateApiKeyCommandResult> {
	constructor(private args: CreateApiKeyArgs) {}

	async execute({ db, providers }: Command.Args): Promise<CreateApiKeyCommandResult> {
		const apiKeyId = providers.uuid()
		let token = undefined
		let tokenHash = this.args.tokenHash
		if (!tokenHash) {
			token = await generateToken(providers)
			tokenHash = computeTokenHash(token)
		}

		await InsertBuilder.create()
			.into('api_key')
			.values({
				id: apiKeyId,
				token_hash: tokenHash,
				type: this.args.type,
				identity_id: this.args.identityId,
				disabled_at: null,
				expires_at: ApiKeyHelper.getExpiration(providers, this.args.type, this.args.expiration),
				expiration: this.args.expiration || null,
				created_at: providers.now(),
			})
			.execute(db)

		return new CreateApiKeyCommandResult(apiKeyId, token)
	}
}

export class CreateApiKeyCommandResult {
	constructor(public readonly id: string, public readonly token?: string) {
	}
}
