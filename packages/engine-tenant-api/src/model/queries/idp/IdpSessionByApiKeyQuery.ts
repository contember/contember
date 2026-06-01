import { DatabaseQuery, DatabaseQueryable, Operator, SelectBuilder } from '@contember/database'
import { Providers } from '../../providers.js'
import type { IDPSessionState } from '../../service/idp/index.js'

export type IdpSessionRow = {
	id: string
	identityProviderId: string
	providerType: string
	providerConfiguration: Record<string, unknown>
	providerDisabledAt: Date | null
	session: IDPSessionState
	/** When the current access token was obtained (sign-in / last refresh) — drives the soft-refresh threshold. */
	tokenObtainedAt: Date | null
	lastValidatedAt: Date
	createdAt: Date
}

type Row = {
	id: string
	identity_provider_id: string
	idp_session_id: string | null
	tokens: Buffer | null
	tokens_version: number | null
	idp_expires_at: Date | null
	token_obtained_at: Date | null
	last_validated_at: Date
	created_at: Date
	provider_type: string
	provider_configuration: Record<string, unknown>
	provider_disabled_at: Date | null
}

/**
 * Fetch the federated-session state bound to a session API key (if any), joined with its
 * identity provider (type + configuration), and decrypt the stored tokens. Returns null for
 * password sessions / IdPs without revalidation. Used on the verify hot path, so it pulls
 * everything the re-validation hook needs in a single round trip.
 */
export class IdpSessionByApiKeyQuery extends DatabaseQuery<IdpSessionRow | null> {
	constructor(private readonly apiKeyId: string, private readonly providers: Providers) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<IdpSessionRow | null> {
		const row = await SelectBuilder.create<Row>()
			.from('idp_session')
			.join(
				'identity_provider',
				'identity_provider',
				on => on.compareColumns(['idp_session', 'identity_provider_id'], Operator.eq, ['identity_provider', 'id']),
			)
			.where({ api_key_id: this.apiKeyId })
			.select(['idp_session', 'id'])
			.select(['idp_session', 'identity_provider_id'])
			.select(['idp_session', 'idp_session_id'])
			.select(['idp_session', 'tokens'])
			.select(['idp_session', 'tokens_version'])
			.select(['idp_session', 'idp_expires_at'])
			.select(['idp_session', 'token_obtained_at'])
			.select(['idp_session', 'last_validated_at'])
			.select(['idp_session', 'created_at'])
			.select(['identity_provider', 'type'], 'provider_type')
			.select(['identity_provider', 'configuration'], 'provider_configuration')
			.select(['identity_provider', 'disabled_at'], 'provider_disabled_at')
			.getResult(db)
			.then(rows => rows[0] ?? null)

		if (!row) {
			return null
		}

		const tokens = row.tokens !== null && row.tokens_version !== null
			? JSON.parse((await this.providers.decrypt(row.tokens, row.tokens_version)).value.toString('utf8')) as Record<string, unknown>
			: undefined

		return {
			id: row.id,
			identityProviderId: row.identity_provider_id,
			providerType: row.provider_type,
			providerConfiguration: row.provider_configuration,
			providerDisabledAt: row.provider_disabled_at,
			tokenObtainedAt: row.token_obtained_at,
			lastValidatedAt: row.last_validated_at,
			createdAt: row.created_at,
			session: {
				sessionId: row.idp_session_id ?? undefined,
				tokens,
				expiresAt: row.idp_expires_at ?? undefined,
			},
		}
	}
}
