import { DatabaseContext } from '../../utils/index.js'
import { ApiKeyRequestInfo } from '../../commands/index.js'
import { ApiKeyRow } from '../../queries/apiKey/ApiKeyQuery.js'
import { IdpSessionByApiKeyQuery, IdpSessionRow } from '../../queries/idp/IdpSessionByApiKeyQuery.js'
import { IDPHandlerRegistry } from './IDPHandlerRegistry.js'
import { ClaimIdpRevalidationCommand } from '../../commands/idp/ClaimIdpRevalidationCommand.js'
import { UpdateIdpSessionCommand } from '../../commands/idp/UpdateIdpSessionCommand.js'
import { DisableApiKeyCommand } from '../../commands/index.js'
import { CreateAuthLogEntryCommand } from '../../commands/authLog/CreateAuthLogEntryCommand.js'
import { REVALIDATION_DEFAULT_FALLBACK_INTERVAL, REVALIDATION_DEFAULT_MIN_INTERVAL, REVALIDATION_DEFAULT_SOFT_THRESHOLD } from './IDPRevalidation.js'
import { IdentityProviderHandler, RevalidationResult } from './IdentityProviderHandler.js'

export type RevalidationOutcome = 'valid' | 'revoked'

type ResolvedRevalidationConfig = {
	enabled: boolean
	softThreshold: number
	minInterval: string
	fallbackInterval: string
	mode: 'auto' | 'blocking'
}

/**
 * Decision for the current request: whether to attempt a revalidation, and if so whether it
 * must block the request. `claimInterval` is the single-flight floor for the atomic claim.
 */
type Decision = null | { blocking: boolean; claimInterval: string }

/**
 * Re-validates IdP-backed sessions against their identity provider on the verify hot path
 * (A24). Invoked from `ApiKeyManager.verifyAndProlong`. Operates entirely through the supplied
 * database contexts and the command bus, so it does not depend on `ApiKeyManager` (no DI cycle).
 *
 * The cadence is driven by the **access-token lifetime**, not a fixed interval:
 *   - while the token is fresh (before `softRefreshThreshold` of its lifetime) → skip, free;
 *   - past the threshold but not yet expired → a proactive **background (SWR)** refresh, so the
 *     request keeps zero added latency and the token is renewed before it dies;
 *   - once the token has actually expired → a **blocking** refresh (we can't serve a dead token).
 * `mode: 'blocking'` forces every revalidation synchronous (zero revocation lag). When the IdP
 * returns no token expiry, falls back to a plain `fallbackInterval` background throttle.
 */
export class IdpSessionRevalidator {
	constructor(
		private readonly idpRegistry: IDPHandlerRegistry,
	) {
	}

	async revalidate(
		dbContext: DatabaseContext,
		readDbContext: DatabaseContext,
		apiKeyRow: ApiKeyRow,
		requestInfo?: ApiKeyRequestInfo,
	): Promise<RevalidationOutcome> {
		const row = await readDbContext.queryHandler.fetch(new IdpSessionByApiKeyQuery(apiKeyRow.id, readDbContext.providers))
		if (!row) {
			// not a federated session (password / IdP without revalidation) — fast no-op
			return 'valid'
		}

		const config = this.resolveConfig(row.providerConfiguration)
		if (!config.enabled) {
			return 'valid'
		}

		// A disabled IdP no longer vouches for its sessions.
		if (row.providerDisabledAt) {
			await this.revoke(dbContext, apiKeyRow, row, 'idp_disabled', requestInfo)
			return 'revoked'
		}

		const handler = this.idpRegistry.getHandlerOrNull(row.providerType)
		if (!handler?.revalidate) {
			// provider can't actively re-validate (e.g. SAML) — rely on expiry / SLO
			return 'valid'
		}

		const decision = this.decide(row, config, dbContext.providers.now())
		if (!decision) {
			// token still fresh — vouched for, no IdP call
			return 'valid'
		}

		// Atomic claim = single-flight. Loser (within the floor window, or lost the race) serves stale.
		let claimed: boolean
		try {
			claimed = await dbContext.commandBus.execute(new ClaimIdpRevalidationCommand(row.id, decision.claimInterval))
		} catch {
			// invalid interval string or transient DB error — fail open, retry next request
			return 'valid'
		}
		if (!claimed) {
			return 'valid'
		}

		if (decision.blocking) {
			return await this.runRevalidation(dbContext, handler, row, apiKeyRow, requestInfo)
		}

		// SWR: serve this request from the (still valid) token, refresh after the response.
		// The work runs detached (after the response is sent), so any rejection — a transient
		// DB error in the revoke / persist writes, a corrupt-config throw — must be swallowed
		// here; otherwise it becomes an unhandledRejection and can take the worker down. The
		// session is simply kept and re-tried on a later request (the claim floor throttles).
		setImmediate(() => {
			this.runRevalidation(dbContext, handler, row, apiKeyRow, requestInfo).catch(() => {})
		})
		return 'valid'
	}

	/**
	 * Decide whether (and how) to revalidate, purely from timestamps — no interval parsing in
	 * JS (the claim handles intervals in SQL). Returns null to skip.
	 */
	private decide(row: IdpSessionRow, config: ResolvedRevalidationConfig, now: Date): Decision {
		const expiresAt = row.session.expiresAt
		const obtainedAt = row.tokenObtainedAt

		// No lifetime info from the IdP → plain background throttle on fallbackInterval.
		if (!expiresAt || !obtainedAt) {
			return { blocking: config.mode === 'blocking', claimInterval: config.fallbackInterval }
		}

		const lifetimeMs = expiresAt.getTime() - obtainedAt.getTime()
		const softAtMs = obtainedAt.getTime() + lifetimeMs * config.softThreshold
		const nowMs = now.getTime()

		if (nowMs < softAtMs) {
			return null // still within the trusted window
		}

		const expired = nowMs >= expiresAt.getTime()
		return { blocking: config.mode === 'blocking' || expired, claimInterval: config.minInterval }
	}

	private async runRevalidation(
		dbContext: DatabaseContext,
		handler: IdentityProviderHandler<{}>,
		row: IdpSessionRow,
		apiKeyRow: ApiKeyRow,
		requestInfo?: ApiKeyRequestInfo,
	): Promise<RevalidationOutcome> {
		let result: RevalidationResult
		try {
			const config = handler.validateConfiguration(row.providerConfiguration)
			result = await handler.revalidate!(config, row.session)
		} catch {
			// transient failure (network / IdP down) or a corrupt stored config — must NOT
			// revoke; keep the session and retry on a later request (the claim floor prevents
			// hammering the IdP).
			return 'valid'
		}

		if (result.status === 'revoked') {
			await this.revoke(dbContext, apiKeyRow, row, result.reason, requestInfo)
			return 'revoked'
		}

		// Still valid — persist the rotated token (resets the lifetime reference) / refreshed
		// expiry. A rotation is a real, low-frequency event (token-lifetime cadence), so we
		// audit it as `idp_session_revalidated`; the no-op userinfo/introspection probes
		// (no rotated session) are intentionally NOT logged to keep the audit log usable.
		//
		// The IdP has already vouched for the session, so these post-success writes are pure
		// best-effort bookkeeping (they only reset the SWR cadence reference). A transient DB
		// error or an `encrypt()` throw here must NOT fail the request — otherwise a blocking
		// revalidation fails closed on a successful refresh, contradicting "fail open" (the SWR
		// path already swallows this). Keep the existing row; the claim floor throttles a retry.
		if (result.idpSession) {
			try {
				await dbContext.commandBus.execute(new UpdateIdpSessionCommand(row.id, result.idpSession))
				await this.logRevalidated(dbContext, apiKeyRow, row, requestInfo)
			} catch {
				// fall through — session stays valid, persist retried on a later request
			}
		}
		return 'valid'
	}

	private async logRevalidated(dbContext: DatabaseContext, apiKeyRow: ApiKeyRow, row: IdpSessionRow, requestInfo?: ApiKeyRequestInfo): Promise<void> {
		await dbContext.commandBus.execute(
			new CreateAuthLogEntryCommand({
				type: 'idp_session_revalidated',
				invokedById: apiKeyRow.identity_id,
				personId: apiKeyRow.person_id ?? undefined,
				identityProviderId: row.identityProviderId,
				personTokenId: apiKeyRow.id,
				success: true,
				ipAddress: requestInfo?.ip,
				userAgent: requestInfo?.userAgent,
			}),
		)
	}

	private async revoke(
		dbContext: DatabaseContext,
		apiKeyRow: ApiKeyRow,
		row: IdpSessionRow,
		reason: string,
		requestInfo?: ApiKeyRequestInfo,
	): Promise<void> {
		await dbContext.commandBus.execute(new DisableApiKeyCommand(apiKeyRow.id))
		await dbContext.commandBus.execute(
			new CreateAuthLogEntryCommand({
				type: 'idp_session_revoked',
				invokedById: apiKeyRow.identity_id,
				personId: apiKeyRow.person_id ?? undefined,
				identityProviderId: row.identityProviderId,
				personTokenId: apiKeyRow.id,
				success: false,
				errorCode: reason,
				ipAddress: requestInfo?.ip,
				userAgent: requestInfo?.userAgent,
				// the action payload belongs in `event_data` (where every other audit event puts
				// it and where the admin UI / AuthLogQueryResolver reads it); `metadata` is for
				// transport context (forwarder IP/UA).
				eventData: { reason },
			}),
		)
	}

	private resolveConfig(configuration: Record<string, unknown>): ResolvedRevalidationConfig {
		const raw = (configuration.revalidation ?? {}) as Record<string, unknown>
		const threshold = typeof raw.softRefreshThreshold === 'number' && raw.softRefreshThreshold > 0 && raw.softRefreshThreshold <= 1
			? raw.softRefreshThreshold
			: REVALIDATION_DEFAULT_SOFT_THRESHOLD
		return {
			enabled: raw.enabled === true,
			softThreshold: threshold,
			minInterval: typeof raw.minInterval === 'string' ? raw.minInterval : REVALIDATION_DEFAULT_MIN_INTERVAL,
			fallbackInterval: typeof raw.fallbackInterval === 'string' ? raw.fallbackInterval : REVALIDATION_DEFAULT_FALLBACK_INTERVAL,
			mode: raw.mode === 'blocking' ? 'blocking' : 'auto',
		}
	}
}
