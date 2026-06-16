import { DatabaseContext } from '../../utils/index.js'
import { IdentityProviderBySlugQuery } from '../../queries/idp/IdentityProviderBySlugQuery.js'
import { IdpSessionBySidRow, IdpSessionsBySidQuery } from '../../queries/idp/IdpSessionsBySidQuery.js'
import { IdpSessionsBySubQuery } from '../../queries/idp/IdpSessionsBySubQuery.js'
import { ApiKeyByIdQuery } from '../../queries/apiKey/ApiKeyQuery.js'
import { DisableApiKeyCommand } from '../../commands/index.js'
import { CreateAuthLogEntryCommand } from '../../commands/authLog/CreateAuthLogEntryCommand.js'
import { IDPHandlerRegistry } from './IDPHandlerRegistry.js'
import { IDPValidationError } from './IDPValidationError.js'

export type BackchannelLogoutResult =
	| { status: 'ok'; revokedCount: number }
	| { status: 'provider_not_found' }
	| { status: 'not_supported' }
	| { status: 'invalid_token'; message: string }

/**
 * Handles an incoming OIDC Back-Channel Logout request (A10). Runs entirely on the HTTP auth path
 * (no GraphQL resolver), so — like {@link IdpSessionRevalidator} — it owns its own audit write
 * rather than deferring to a resolver. Flow:
 *   1. resolve the IdP by slug (the back-channel endpoint carries a `?provider=` query param, since
 *      the IdP only knows which client it is calling, not the Contember tenant/provider record);
 *   2. validate the IdP-signed logout token and extract `sid` / `sub`;
 *   3. look up the local federated session(s) the token targets and revoke their api_key(s).
 *
 * A logout token with a `sid` targets that single IdP session; a `sub`-only token (rare — most IdPs
 * send a `sid`) targets *all* of that subject's federated sessions under the provider. Either way, a
 * token that matches no live session is reported as `revokedCount: 0` and audited, not failed.
 */
export class BackchannelLogoutManager {
	constructor(
		private readonly idpRegistry: IDPHandlerRegistry,
	) {}

	async logout(db: DatabaseContext, providerSlug: string, logoutToken: string): Promise<BackchannelLogoutResult> {
		const provider = await db.queryHandler.fetch(new IdentityProviderBySlugQuery(providerSlug))
		if (!provider) {
			return { status: 'provider_not_found' }
		}

		const handler = this.idpRegistry.getHandlerOrNull(provider.type)
		if (!handler?.validateLogoutToken) {
			return { status: 'not_supported' }
		}

		let config: {}
		try {
			config = handler.validateConfiguration(provider.configuration)
		} catch (e) {
			return { status: 'invalid_token', message: 'IdP configuration is invalid' }
		}

		let claims: { sid?: string; sub?: string }
		try {
			claims = await handler.validateLogoutToken(config, logoutToken)
		} catch (e) {
			return { status: 'invalid_token', message: e instanceof IDPValidationError ? e.message : 'Invalid logout token' }
		}

		const sessions = await this.resolveTargetSessions(db, provider.id, claims)
		let revokedCount = 0
		for (const session of sessions) {
			const disabled = await db.commandBus.execute(new DisableApiKeyCommand(session.apiKeyId))
			if (disabled) {
				revokedCount++
			}
		}

		await this.audit(db, provider.id, claims, revokedCount, sessions[0]?.apiKeyId)

		return { status: 'ok', revokedCount }
	}

	private async resolveTargetSessions(
		db: DatabaseContext,
		identityProviderId: string,
		claims: { sid?: string; sub?: string },
	): Promise<IdpSessionBySidRow[]> {
		// Prefer `sid` (targets one session); fall back to `sub` (targets all the subject's sessions).
		if (claims.sid) {
			return db.queryHandler.fetch(new IdpSessionsBySidQuery(identityProviderId, claims.sid))
		}
		if (claims.sub) {
			return db.queryHandler.fetch(new IdpSessionsBySubQuery(identityProviderId, claims.sub))
		}
		return []
	}

	private async audit(
		db: DatabaseContext,
		identityProviderId: string,
		claims: { sid?: string; sub?: string },
		revokedCount: number,
		targetApiKeyId: string | undefined,
	): Promise<void> {
		// Resolve the affected identity for the audit `invoked_by_id` from a targeted session, when
		// one resolves. Otherwise leave it unset (→ NULL) — the provider id is NOT a valid identity id
		// and inserting it would violate the `invoked_by_id` FK (the provider is recorded separately
		// in `identity_provider_id`).
		let invokedById: string | undefined
		let personId: string | undefined
		if (targetApiKeyId) {
			const apiKeyRow = await db.queryHandler.fetch(new ApiKeyByIdQuery(targetApiKeyId))
			if (apiKeyRow) {
				invokedById = apiKeyRow.identity_id
				personId = apiKeyRow.person_id ?? undefined
			}
		}

		try {
			await db.commandBus.execute(
				new CreateAuthLogEntryCommand({
					type: 'idp_backchannel_logout',
					invokedById,
					personId,
					identityProviderId,
					success: true,
					eventData: { sid: claims.sid ?? null, sub: claims.sub ?? null, revokedCount },
				}),
			)
		} catch {
			// best-effort observability — never fail the logout because the audit write failed
		}
	}
}
