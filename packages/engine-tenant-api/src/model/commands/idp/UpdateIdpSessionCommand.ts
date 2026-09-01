import { Command } from '../Command.js'
import { Literal, QueryBuilder, UpdateBuilder } from '@contember/database'
import type { IDPSessionState } from '../../service/idp/index.js'

/**
 * Update a federated session after a successful re-validation: bump `last_validated_at`
 * and persist rotated tokens / refreshed IdP expiry. Pass `session` undefined to only
 * touch `last_validated_at` (e.g. userinfo/introspection methods that don't rotate tokens).
 */
export class UpdateIdpSessionCommand implements Command<void> {
	constructor(
		private readonly id: string,
		private readonly session?: IDPSessionState,
	) {
	}

	async execute({ db, providers }: Command.Args): Promise<void> {
		const values: QueryBuilder.Values = {
			// DB clock, matching ClaimIdpRevalidationCommand's throttle comparison. See CLAUDE.md.
			last_validated_at: new Literal('now()'),
		}

		if (this.session) {
			if (this.session.tokens) {
				const { value, version } = await providers.encrypt(Buffer.from(JSON.stringify(this.session.tokens), 'utf8'))
				values.tokens = value
				values.tokens_version = version
				// a new token was issued — reset the lifetime reference for the soft-refresh threshold
				values.token_obtained_at = providers.now()
			}
			if (this.session.sessionId !== undefined) {
				values.idp_session_id = this.session.sessionId
			}
			if (this.session.expiresAt !== undefined) {
				values.idp_expires_at = this.session.expiresAt
			}
		}

		await UpdateBuilder.create()
			.table('idp_session')
			.values(values)
			.where({ id: this.id })
			.execute(db)
	}
}
