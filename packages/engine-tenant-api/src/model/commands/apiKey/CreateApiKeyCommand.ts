import { Command } from '../Command'
import { ApiKey } from '../../type'
import { ApiKeyHelper } from './ApiKeyHelper'
import { InsertBuilder } from '@contember/database'
import { computeTokenHash, generateToken, TokenHash } from '../../utils'
import { ApiKeyRequestInfo } from './ProlongApiKeyCommand'

interface CreateSessionApiKeyArgs {
	type: ApiKey.Type.SESSION
	identityId: string
	expiration?: number
	tokenHash?: string
	requestInfo?: ApiKeyRequestInfo
	trustForwardedInfo?: boolean
	/**
	 * A19 session-policy snapshot, fixed at sign-in. NULLs preserve today's
	 * behavior (no idle timeout, no absolute cap on the sliding window).
	 * `idleTimeout` is a Postgres interval literal (e.g. `'15 minutes'`).
	 */
	idleTimeout?: string | null
	maxExpiresAt?: Date | null
}

interface CreatePermanentApiKeyArgs {
	type: ApiKey.Type.PERMANENT
	identityId: string
	tokenHash?: TokenHash
	expiration?: undefined
	requestInfo?: ApiKeyRequestInfo
	trustForwardedInfo?: boolean
}

export type CreateApiKeyArgs =
	| CreateSessionApiKeyArgs
	| CreatePermanentApiKeyArgs

export class CreateApiKeyCommand implements Command<CreateApiKeyCommandResult> {
	constructor(private args: CreateApiKeyArgs) {}

	async execute({ db, providers }: Command.Args): Promise<CreateApiKeyCommandResult> {
		const apiKeyId = providers.uuid()
		let token
		let tokenHash = this.args.tokenHash
		if (!tokenHash) {
			token = await generateToken(providers)
			tokenHash = computeTokenHash(token)
		}

		// Session-policy snapshot (A19). Only session keys carry it; permanent/one-off
		// keys have no session policy → NULL (preserving today's behavior).
		const args = this.args
		const sessionPolicy = args.type === ApiKey.Type.SESSION
			? {
				issued_at: providers.now(),
				idle_timeout: args.idleTimeout ?? null,
				max_expires_at: args.maxExpiresAt ?? null,
			}
			: { issued_at: null, idle_timeout: null, max_expires_at: null }
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
				created_ip: this.args.requestInfo?.ip || null,
				created_user_agent: this.args.requestInfo?.userAgent || null,
				trust_forwarded_info: this.args.trustForwardedInfo ?? false,
				issued_at: sessionPolicy.issued_at,
				idle_timeout: sessionPolicy.idle_timeout,
				max_expires_at: sessionPolicy.max_expires_at,
			})
			.execute(db)

		return new CreateApiKeyCommandResult(apiKeyId, token)
	}
}

export class CreateApiKeyCommandResult {
	constructor(public readonly id: string, public readonly token?: string) {
	}
}
