import { Command } from './Command'
import { ApiKey } from '../type'
import { ApiKeyHelper } from './ApiKeyHelper'
import { InsertBuilder } from '@contember/database'
import { computeTokenHash, generateToken } from '../utils'

export class CreateApiKeyCommand implements Command<CreateApiKeyCommandResult> {
	private readonly type: ApiKey.Type
	private readonly identityId: string
	private readonly expiration: number | undefined

	constructor(type: ApiKey.Type.SESSION, identityId: string, expiration?: number)
	constructor(type: ApiKey.Type, identityId: string)
	constructor(type: ApiKey.Type, identityId: string, expiration?: number) {
		this.type = type
		this.identityId = identityId
		this.expiration = expiration
	}

	async execute({ db, providers }: Command.Args): Promise<CreateApiKeyCommandResult> {
		const apiKeyId = providers.uuid()
		const token = await generateToken(providers)
		const tokenHash = computeTokenHash(token)

		await InsertBuilder.create()
			.into('api_key')
			.values({
				id: apiKeyId,
				token_hash: tokenHash,
				type: this.type,
				identity_id: this.identityId,
				disabled_at: null,
				expires_at: ApiKeyHelper.getExpiration(providers, this.type, this.expiration),
				expiration: this.expiration || null,
				created_at: providers.now(),
			})
			.execute(db)

		return new CreateApiKeyCommandResult(apiKeyId, token)
	}
}
export class CreateApiKeyCommandResult {
	constructor(public readonly id: string, public readonly token: string) {}
}
