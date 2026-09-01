import { Command } from '../Command.js'
import { InsertBuilder, Literal } from '@contember/database'
import type { IDPSessionState } from '../../service/idp/index.js'

/**
 * Persist the federated-session state for a freshly created session API key, so it can be
 * re-validated against the IdP later. The `tokens` blob is encrypted at rest via
 * `providers.encrypt` (same pattern as project secrets).
 */
export class CreateIdpSessionCommand implements Command<void> {
	constructor(
		private readonly apiKeyId: string,
		private readonly identityProviderId: string,
		private readonly session: IDPSessionState,
	) {
	}

	async execute({ db, providers }: Command.Args): Promise<void> {
		const id = providers.uuid()
		const tokens = this.session.tokens
			? await providers.encrypt(Buffer.from(JSON.stringify(this.session.tokens), 'utf8'))
			: null

		await InsertBuilder.create()
			.into('idp_session')
			.values({
				id,
				api_key_id: this.apiKeyId,
				identity_provider_id: this.identityProviderId,
				idp_session_id: this.session.sessionId ?? null,
				tokens: tokens?.value ?? null,
				tokens_version: tokens?.version ?? null,
				idp_expires_at: this.session.expiresAt ?? null,
				token_obtained_at: providers.now(),
				// last_validated_at is written on the DB clock to match the throttle
				// comparison in ClaimIdpRevalidationCommand (`last_validated_at <= now() -
				// interval`), so revalidation timing can't be skewed. See CLAUDE.md.
				last_validated_at: new Literal('now()'),
			})
			.execute(db)
	}
}
