import { ApiKeyManager } from './apiKey/index.js'
import { DatabaseContext } from '../utils/index.js'
import { ApiKey } from '../type/index.js'
import { PersonQuery } from '../queries/index.js'
import { IdpSessionByApiKeyQuery } from '../queries/idp/IdpSessionByApiKeyQuery.js'
import { IDPHandlerRegistry } from './idp/IDPHandlerRegistry.js'
import { Response, ResponseError, ResponseOk } from '../utils/Response.js'

export type SignOutErrorCode = 'NOT_A_PERSON' | 'NOT_POSSIBLE_SIGN_OUT_WITH_PERMANENT_API_KEY'

export type SignOutResult = {
	/** Set when the session was federated via an OIDC IdP that exposes RP-initiated logout. */
	readonly logoutUrl: string | null
	/** The IdP this session belonged to, for auditing. Null for plain (password) sessions. */
	readonly identityProviderId: string | null
}

export type SignOutResponse = Response<SignOutResult, SignOutErrorCode>

/**
 * Owns the sign-out flow (extracted from `SignOutMutationResolver`, A10):
 *   - the existing local logout (disable this session, or all of the identity's sessions);
 *   - OIDC Single Logout — when the session was federated and the IdP advertises an
 *     `end_session_endpoint`, build the RP-initiated (front-channel) logout redirect URL the admin
 *     should send the browser to. Legacy IdPs without `end_session_endpoint` (and password
 *     sessions) gracefully fall back to a local-only logout with no `logoutUrl`.
 *
 * Auditing lives at the resolver layer (the manager only returns what happened), matching the
 * existing convention.
 */
export class SignOutManager {
	constructor(
		private readonly apiKeyManager: ApiKeyManager,
		private readonly idpRegistry: IDPHandlerRegistry,
	) {}

	async signOut(
		db: DatabaseContext,
		identityId: string,
		apiKeyId: string,
		all: boolean,
	): Promise<SignOutResponse> {
		const person = await db.queryHandler.fetch(PersonQuery.byIdentity(identityId))
		if (!person) {
			return new ResponseError('NOT_A_PERSON', 'Only a person can sign out')
		}

		const personApiKey = await this.apiKeyManager.findApiKey(db, apiKeyId)
		if (personApiKey?.type === ApiKey.Type.PERMANENT) {
			return new ResponseError(
				'NOT_POSSIBLE_SIGN_OUT_WITH_PERMANENT_API_KEY',
				'Only session API keys can be used for person sign out.',
			)
		}

		// Resolve the RP-initiated logout URL *before* disabling the key — the federated-session row
		// is removed (FK ON DELETE CASCADE) once the api_key is gone, and we need its id_token.
		const logout = await this.resolveOidcLogout(db, apiKeyId)

		if (all) {
			await this.apiKeyManager.disableIdentityApiKeys(db, identityId)
		} else {
			await this.apiKeyManager.disableApiKey(db, apiKeyId)
		}

		return new ResponseOk({
			logoutUrl: logout?.logoutUrl ?? null,
			identityProviderId: logout?.identityProviderId ?? null,
		})
	}

	private async resolveOidcLogout(
		db: DatabaseContext,
		apiKeyId: string,
	): Promise<{ logoutUrl: string | null; identityProviderId: string } | null> {
		const idpSession = await db.queryHandler.fetch(new IdpSessionByApiKeyQuery(apiKeyId, db.providers))
		if (!idpSession) {
			// not a federated session (password / IdP without revalidation) — local logout only
			return null
		}

		const handler = this.idpRegistry.getHandlerOrNull(idpSession.providerType)
		if (!handler?.buildLogoutUrl) {
			// provider can't initiate logout at the IdP (e.g. Apple / Facebook) — local logout only
			return { logoutUrl: null, identityProviderId: idpSession.identityProviderId }
		}

		let config: {}
		try {
			config = handler.validateConfiguration(idpSession.providerConfiguration)
		} catch {
			// corrupt stored config must not break sign-out — degrade to a local-only logout
			return { logoutUrl: null, identityProviderId: idpSession.identityProviderId }
		}

		const idToken = typeof idpSession.session.tokens?.id_token === 'string' ? idpSession.session.tokens.id_token : undefined
		try {
			const logoutUrl = await handler.buildLogoutUrl(config, {
				idToken,
				postLogoutRedirectUri: typeof (idpSession.providerConfiguration as { postLogoutRedirectUri?: unknown }).postLogoutRedirectUri === 'string'
					? (idpSession.providerConfiguration as { postLogoutRedirectUri: string }).postLogoutRedirectUri
					: undefined,
			})
			return { logoutUrl, identityProviderId: idpSession.identityProviderId }
		} catch {
			// discovery / IdP unreachable must not block local sign-out — degrade gracefully
			return { logoutUrl: null, identityProviderId: idpSession.identityProviderId }
		}
	}
}
