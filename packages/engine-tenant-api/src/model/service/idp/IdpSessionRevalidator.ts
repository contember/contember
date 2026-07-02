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
import { IDPClaimSyncService } from './IDPClaimSyncService.js'
import { parseClaimMapping } from './ClaimMapping.js'
import { JSONValue } from '@contember/schema'

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
		private readonly claimSyncService: IDPClaimSyncService,
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
		let config: {}
		try {
			config = handler.validateConfiguration(row.providerConfiguration)
		} catch {
			// corrupt stored config — must NOT revoke; keep the session and retry later. Audit
			// it so the operator can tell "vouched for" apart from "silently broken" (without an
			// entry, a config typo disables re-validation invisibly for the life of every session).
			await this.logRevalidationFailed(dbContext, apiKeyRow, row, 'config_invalid', requestInfo)
			return 'valid'
		}

		let result: RevalidationResult
		try {
			result = await handler.revalidate!(config, row.session)
		} catch {
			// transient failure (network / IdP down) — must NOT revoke; keep the session and retry
			// on a later request (the claim floor prevents hammering the IdP). Audited (throttled
			// to one entry per claim window) so a prolonged IdP outage is visible rather than a
			// silent fail-open.
			await this.logRevalidationFailed(dbContext, apiKeyRow, row, 'revalidation_error', requestInfo)
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

		// A09 — re-apply the IdP's claim mapping when the refresh returned fresh claims, so an `always`
		// mapping keeps an established session's project memberships in sync with the IdP's current claims
		// without requiring a full re-login. `sticky` mappings self-skip (the sync passes isNewPerson=false).
		// `claimsComplete` tells the sync whether the refresh rebuilt sign-in's full claim surface, so it can
		// reconcile (incl. `unmatched: "remove"`) exactly like sign-in. Strictly fail-open — see `syncClaims`.
		if (result.claims) {
			await this.syncClaims(dbContext, row, apiKeyRow, result.claims, result.claimsComplete === true, requestInfo)
		}
		return 'valid'
	}

	/**
	 * Re-apply the claim mapping on a successful refresh. Runs in its own transaction (atomic apply of
	 * the membership changes) and never throws: the IdP has already vouched for the session, so a
	 * malformed mapping or a transient apply error must not revoke or fail it. A real membership change
	 * is audited as `idp_role_mapped`; a failure is audited as `idp_role_mapping_failed` (fail-open
	 * marker), mirroring the sign-in path. `claimsComplete` carries whether the refresh rebuilt sign-in's
	 * full claim surface (so removal reconciliation is safe) — see `allowRemoval` below.
	 */
	private async syncClaims(
		dbContext: DatabaseContext,
		row: IdpSessionRow,
		apiKeyRow: ApiKeyRow,
		claims: Record<string, unknown>,
		claimsComplete: boolean,
		requestInfo?: ApiKeyRequestInfo,
	): Promise<void> {
		try {
			const mapping = parseClaimMapping(row.providerConfiguration)
			if (!mapping) {
				return
			}
			// Atomic apply in its own transaction (the verify path has no surrounding one). `always`-only:
			// the sync passes isNewPerson=false, so a `sticky` mapping self-skips and returns a null audit.
			// Refresh mirrors sign-in as closely as the claim surface allows: when the provider returned its
			// COMPLETE surface (`claimsComplete` — `method: "refresh"` rebuilding sign-in's id-token + userinfo
			// merge), `unmatched: "remove"` reconciliation runs here too. A partial surface (a userinfo-only
			// probe, or a refresh whose userinfo fetch failed) passes `allowRemoval: false`, so refresh stays
			// additive-only and a membership the IdP still asserts is never stripped off an incomplete surface.
			const { audit, droppedUnsafeRules } = await dbContext.transaction(db =>
				this.claimSyncService.sync(db, mapping, claims, { id: apiKeyRow.identity_id }, false, { allowRemoval: claimsComplete })
			)
			if (audit) {
				await this.logRoleMapping(dbContext, apiKeyRow, row, 'idp_role_mapped', audit, requestInfo)
			}
			// The apply-time safety backstop dropped a configured rule — emit the fail-open marker so a broken
			// mapping is visible on the refresh path too, mirroring sign-in (the marker carries no claim values).
			if (droppedUnsafeRules) {
				await this.logRoleMapping(dbContext, apiKeyRow, row, 'idp_role_mapping_failed', undefined, requestInfo)
			}
		} catch {
			// Strictly fail-open: a malformed mapping or a transient apply error must never revoke or
			// fail an already-vouched-for session. The transaction rolls back any partial apply.
			await this.logRoleMapping(dbContext, apiKeyRow, row, 'idp_role_mapping_failed', undefined, requestInfo)
		}
	}

	private async logRoleMapping(
		dbContext: DatabaseContext,
		apiKeyRow: ApiKeyRow,
		row: IdpSessionRow,
		type: 'idp_role_mapped' | 'idp_role_mapping_failed',
		eventData: JSONValue | undefined,
		requestInfo?: ApiKeyRequestInfo,
	): Promise<void> {
		try {
			await dbContext.commandBus.execute(
				new CreateAuthLogEntryCommand({
					type,
					invokedById: apiKeyRow.identity_id,
					personId: apiKeyRow.person_id ?? undefined,
					// The membership change affects this session's own person — record it as the target too,
					// so an admin querying membership changes by target_person_id sees IdP-driven grants/revokes
					// (consistent with the project_membership_* audit events).
					targetPersonId: apiKeyRow.person_id ?? undefined,
					identityProviderId: row.identityProviderId,
					personTokenId: apiKeyRow.id,
					success: true,
					eventData,
					ipAddress: requestInfo?.ip,
					userAgent: requestInfo?.userAgent,
				}),
			)
		} catch {
			// best-effort audit — never fail the request because the audit write failed
		}
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

	/**
	 * Audit a fail-open: the IdP couldn't be consulted (transient outage) or the stored config is
	 * corrupt, so we kept the session rather than revoking it. Naturally throttled to one entry
	 * per claim window (we only reach here after a successful claim, which bumps
	 * `last_validated_at`). The write is best-effort and self-contained — a failure to audit must
	 * never propagate and fail a blocking verify request (the whole point of failing open).
	 */
	private async logRevalidationFailed(
		dbContext: DatabaseContext,
		apiKeyRow: ApiKeyRow,
		row: IdpSessionRow,
		errorCode: 'config_invalid' | 'revalidation_error',
		requestInfo?: ApiKeyRequestInfo,
	): Promise<void> {
		try {
			await dbContext.commandBus.execute(
				new CreateAuthLogEntryCommand({
					type: 'idp_session_revalidation_failed',
					invokedById: apiKeyRow.identity_id,
					personId: apiKeyRow.person_id ?? undefined,
					identityProviderId: row.identityProviderId,
					personTokenId: apiKeyRow.id,
					// not a security failure (the session is kept) — a fail-open marker the operator
					// can alert on. `success: true` keeps it out of the failed-login funnels.
					success: true,
					errorCode,
					ipAddress: requestInfo?.ip,
					userAgent: requestInfo?.userAgent,
				}),
			)
		} catch {
			// best-effort observability — never fail the request because the audit write failed
		}
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
