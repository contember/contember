import {
	ApiKeyRequestInfo,
	CreateApiKeyCommand,
	DisableApiKeyCommand,
	DisableIdentityApiKeysCommand,
	DisableOneOffApiKeyCommand,
	ProlongApiKeyCommand,
} from '../../commands/index.js'
import { ApiKey } from '../../type/index.js'

import { Response, ResponseError, ResponseOk } from '../../utils/Response.js'
import { DatabaseContext, TokenHash } from '../../utils/index.js'
import { ApiKeyService, CreateApiKeyResponse } from './ApiKeyService.js'
import assert from 'node:assert'
import { Acl } from '@contember/schema'
import { ApiKeyByIdQuery, ApiKeyByTokenQuery, ApiKeyRow, ConfigurationQuery, IdentityQuery } from '../../queries/index.js'
import PostgresInterval from 'postgres-interval'
import { Config } from '../../type/Config.js'
import { intervalToPostgres, intervalToSeconds } from '../../utils/interval.js'
import { AuthPolicyResolver } from '../AuthPolicyResolver.js'
import { AuthLogService } from '../AuthLogService.js'

export class ApiKeyManager {
	constructor(
		private readonly apiKeyService: ApiKeyService,
		private readonly authPolicyResolver: AuthPolicyResolver,
		private readonly authLogService: AuthLogService,
	) {}

	async verifyAndProlong(
		dbContext: DatabaseContext,
		readDbContext: DatabaseContext,
		token: string,
		requestInfo?: ApiKeyRequestInfo,
		forwardedInfo?: ApiKeyRequestInfo,
	): Promise<VerifyResponse> {
		const apiKeyRow = await readDbContext.queryHandler.fetch(new ApiKeyByTokenQuery(token))
		if (apiKeyRow === null) {
			return new ResponseError(VerifyErrorCode.NOT_FOUND, 'API key was not found')
		}

		if (apiKeyRow.disabled_at !== null) {
			return new ResponseError(
				VerifyErrorCode.DISABLED,
				`API key was disabled at ${apiKeyRow.disabled_at.toISOString()}`,
			)
		}

		const now = new Date()
		if (apiKeyRow.expires_at !== null && apiKeyRow.expires_at <= now) {
			return new ResponseError(VerifyErrorCode.DISABLED, `API key expired at ${apiKeyRow.expires_at.toISOString()}`)
		}

		// A19: absolute hard cap (defensive — the prolong clamp should already keep
		// expires_at <= max_expires_at, but enforce it here regardless).
		if (apiKeyRow.max_expires_at !== null && apiKeyRow.max_expires_at <= now) {
			await dbContext.commandBus.execute(new DisableApiKeyCommand(apiKeyRow.id))
			return new ResponseError(
				VerifyErrorCode.DISABLED,
				`API key reached its maximum lifetime at ${apiKeyRow.max_expires_at.toISOString()}`,
			)
		}

		// A19: idle timeout. Reject + disable when the session has been idle longer
		// than the policy's idle_timeout. A null idle_timeout (today's default) or a
		// never-used key (last_used_at null) are never idle-expired.
		if (apiKeyRow.idle_timeout !== null && apiKeyRow.last_used_at !== null) {
			const idleMs = intervalToSeconds(apiKeyRow.idle_timeout) * 1000
			if (now.getTime() - apiKeyRow.last_used_at.getTime() > idleMs) {
				await dbContext.commandBus.execute(new DisableApiKeyCommand(apiKeyRow.id))
				try {
					await this.authLogService.logSessionEvent(dbContext, {
						type: 'session_expired_idle',
						identityId: apiKeyRow.identity_id,
						personId: apiKeyRow.person_id,
						ipAddress: requestInfo?.ip,
						userAgent: requestInfo?.userAgent,
						success: false,
						eventData: {
							lastUsedAt: apiKeyRow.last_used_at?.toISOString() ?? null,
							idleTimeout: String(apiKeyRow.idle_timeout),
						},
					})
				} catch {
					/* best-effort: auth path must stay resilient */
				}
				return new ResponseError(
					VerifyErrorCode.DISABLED,
					`API key was idle since ${apiKeyRow.last_used_at.toISOString()} and exceeded the idle timeout`,
				)
			}
		}

		const effectiveInfo: ApiKeyRequestInfo | undefined = apiKeyRow.trust_forwarded_info && forwardedInfo
			? {
				ip: forwardedInfo.ip ?? requestInfo?.ip,
				userAgent: forwardedInfo.userAgent ?? requestInfo?.userAgent,
			}
			: requestInfo

		setImmediate(async () => {
			await dbContext.commandBus.execute(
				new ProlongApiKeyCommand(
					apiKeyRow.id,
					apiKeyRow.type,
					apiKeyRow.expiration,
					apiKeyRow.expires_at,
					effectiveInfo,
					{
						lastIp: apiKeyRow.last_ip,
						lastUserAgent: apiKeyRow.last_user_agent,
						lastUsedAt: apiKeyRow.last_used_at,
					},
					apiKeyRow.max_expires_at,
				),
			)
		})

		return new ResponseOk(
			new VerifyResult(
				apiKeyRow.identity_id,
				apiKeyRow.id,
				apiKeyRow.roles,
				apiKeyRow.person_id,
				apiKeyRow.trust_forwarded_info,
			),
		)
	}

	async createSessionApiKey(
		dbContext: DatabaseContext,
		identityId: string,
		expiration?: number,
		requestInfo?: ApiKeyRequestInfo,
		trustForwardedInfo?: boolean,
	): Promise<string> {
		const config = await dbContext.queryHandler.fetch(new ConfigurationQuery(dbContext.providers))

		// A19: snapshot the effective session policy onto the api_key at sign-in.
		// With no matching policy, every field is null/baseline and the result is
		// byte-for-byte today's behavior.
		const [identityRow] = await dbContext.queryHandler.fetch(new IdentityQuery([identityId]))
		const globalRoles = identityRow?.roles ?? []
		const policy = await this.authPolicyResolver.resolveForIdentity(dbContext, identityId, globalRoles)

		const defaultExpirationMinutes = intervalToSeconds(config.login.defaultTokenExpiration) / 60
		// remember_me_allowed === false: ignore a client-supplied longer lifetime and
		// force the default. (true/null leave the requested expiration untouched.)
		const requestedMinutes = policy.rememberMeAllowed === false
			? defaultExpirationMinutes
			: (expiration ?? defaultExpirationMinutes)

		// Cap by maxTokenExpiration (existing behavior) AND by the policy's
		// tokenExpiration (A19) — strictest wins.
		let expirationCapped = config.login.maxTokenExpiration
			? Math.min(requestedMinutes, intervalToSeconds(config.login.maxTokenExpiration) / 60)
			: requestedMinutes
		if (policy.tokenExpiration) {
			expirationCapped = Math.min(expirationCapped, intervalToSeconds(policy.tokenExpiration) / 60)
		}

		// Absolute hard cap: issued_at + policy.tokenExpiration. NULL = uncapped
		// sliding window (today's behavior).
		const issuedAt = dbContext.providers.now()
		const maxExpiresAt = policy.tokenExpiration
			? new Date(issuedAt.getTime() + intervalToSeconds(policy.tokenExpiration) * 1000)
			: null

		const command = new CreateApiKeyCommand({
			type: ApiKey.Type.SESSION,
			identityId,
			expiration: expirationCapped,
			requestInfo,
			trustForwardedInfo,
			idleTimeout: policy.idleTimeout ? intervalToPostgres(policy.idleTimeout) : null,
			maxExpiresAt,
		})
		const token = (await dbContext.commandBus.execute(command)).token
		assert(token !== undefined)

		// A19: audit only when a policy is actually in effect. With zero auth_policy
		// rows the resolved policy is inert and no extra insert happens.
		const policyApplied = policy.mfaRequired === true
			|| policy.tokenExpiration !== null
			|| policy.idleTimeout !== null
			|| policy.rememberMeAllowed !== null
		if (policyApplied) {
			try {
				await this.authLogService.logSessionEvent(dbContext, {
					type: 'session_policy_applied',
					identityId,
					ipAddress: requestInfo?.ip,
					userAgent: requestInfo?.userAgent,
					success: true,
					eventData: {
						tokenExpiration: policy.tokenExpiration ? intervalToPostgres(policy.tokenExpiration) : null,
						idleTimeout: policy.idleTimeout ? intervalToPostgres(policy.idleTimeout) : null,
						rememberMeAllowed: policy.rememberMeAllowed,
						mfaRequired: policy.mfaRequired,
					},
				})
			} catch {
				/* best-effort: sign-in must not break on an audit failure */
			}
		}

		return token
	}

	async findApiKey(dbContext: DatabaseContext, apiKeyId: string): Promise<ApiKeyRow | null> {
		return await dbContext.queryHandler.fetch(
			new ApiKeyByIdQuery(apiKeyId),
		)
	}

	async disableOneOffApiKey(dbContext: DatabaseContext, apiKeyId: string): Promise<void> {
		await dbContext.commandBus.execute(new DisableOneOffApiKeyCommand(apiKeyId))
	}

	async disableApiKey(dbContext: DatabaseContext, apiKeyId: string): Promise<boolean> {
		return await dbContext.commandBus.execute(new DisableApiKeyCommand(apiKeyId))
	}

	async disableIdentityApiKeys(dbContext: DatabaseContext, identityId: string): Promise<void> {
		await dbContext.commandBus.execute(new DisableIdentityApiKeysCommand(identityId))
	}

	async createGlobalPermanentApiKey(
		dbContext: DatabaseContext,
		description: string,
		roles: readonly string[],
		tokenHash?: TokenHash,
		trustForwardedInfo?: boolean,
	): Promise<CreateApiKeyResponse> {
		return await dbContext.transaction(async db => {
			return await this.apiKeyService.createPermanentApiKey(db, description, roles, tokenHash, trustForwardedInfo)
		})
	}

	async createProjectPermanentApiKey(
		dbContext: DatabaseContext,
		projectId: string,
		memberships: readonly Acl.Membership[],
		description: string,
		tokenHash?: TokenHash,
		trustForwardedInfo?: boolean,
	): Promise<CreateApiKeyResponse> {
		return await dbContext.transaction(async db => {
			return await this.apiKeyService.createProjectPermanentApiKey(db, projectId, memberships, description, tokenHash, trustForwardedInfo)
		})
	}
}

export type VerifyResponse = Response<VerifyResult, VerifyErrorCode>

export class VerifyResult {
	readonly valid = true

	constructor(
		public readonly identityId: string,
		public readonly apiKeyId: string,
		public readonly roles: string[],
		public readonly personId: string | null,
		public readonly trustForwardedInfo: boolean = false,
	) {}
}

export enum VerifyErrorCode {
	NOT_FOUND = 'not_found',
	DISABLED = 'disabled',
	EXPIRED = 'expired',
	NO_AUTH_HEADER = 'no_auth_header',
	INVALID_AUTH_HEADER = 'invalid_auth_header',
}
