import { SQL } from '../../../../src/tags.js'
import { ExpectedQuery } from '@contember/database-tester'

/**
 * Mocks {@link IdpSessionByApiKeyQuery} — the lookup the sign-out flow runs to discover whether a
 * session was federated (and which IdP) so it can build an RP-initiated logout URL (A10).
 */
export const getIdpSessionByApiKeySql = (args: {
	apiKeyId: string
	response: null | {
		id: string
		identityProviderId: string
		providerType: string
		providerConfiguration: Record<string, unknown>
		providerDisabledAt?: Date | null
		idpSessionId?: string | null
		/** Encrypted token blob; pair with a `decrypt` provider override to surface tokens. */
		tokens?: Buffer | null
		tokensVersion?: number | null
	}
}): ExpectedQuery => ({
	sql: SQL`
		select "idp_session"."id", "idp_session"."identity_provider_id", "idp_session"."idp_session_id",
			"idp_session"."tokens", "idp_session"."tokens_version", "idp_session"."idp_expires_at",
			"idp_session"."token_obtained_at", "idp_session"."last_validated_at", "idp_session"."created_at",
			"identity_provider"."type" as "provider_type", "identity_provider"."configuration" as "provider_configuration",
			"identity_provider"."disabled_at" as "provider_disabled_at"
		from "tenant"."idp_session"
		inner join "tenant"."identity_provider" as "identity_provider"
			on "idp_session"."identity_provider_id" = "identity_provider"."id"
		where "api_key_id" = ?
	`,
	parameters: [args.apiKeyId],
	response: {
		rows: args.response
			? [
				{
					id: args.response.id,
					identity_provider_id: args.response.identityProviderId,
					idp_session_id: args.response.idpSessionId ?? null,
					tokens: args.response.tokens ?? null,
					tokens_version: args.response.tokensVersion ?? null,
					idp_expires_at: null,
					token_obtained_at: null,
					last_validated_at: new Date(),
					created_at: new Date(),
					provider_type: args.response.providerType,
					provider_configuration: args.response.providerConfiguration,
					provider_disabled_at: args.response.providerDisabledAt ?? null,
				},
			]
			: [],
	},
})
