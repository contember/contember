import {
	CreateApiKeyCommand,
	DisableApiKeyCommand,
	DisableIdentityApiKeysCommand,
	DisableOneOffApiKeyCommand,
	ProlongApiKeyCommand,
} from '../../commands'
import { ApiKey } from '../../type'

import { Response, ResponseError, ResponseOk } from '../../utils/Response'
import { DatabaseContext, TokenHash } from '../../utils'
import { ApiKeyService, CreateApiKeyResponse } from './ApiKeyService'
import assert from 'node:assert'
import { Acl } from '@contember/schema'
import { ApiKeyByIdQuery, ApiKeyByTokenQuery, ApiKeyRow, ConfigurationQuery } from '../../queries'
import PostgresInterval from 'postgres-interval'
import { Config } from '../../type/Config'
import { intervalToSeconds } from '../../utils/interval'

export class ApiKeyManager {
	constructor(
		private readonly apiKeyService: ApiKeyService,
	) {}

	async verifyAndProlong(
		dbContext: DatabaseContext,
		readDbContext: DatabaseContext,
		token: string,
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

		setImmediate(async () => {
			await dbContext.commandBus.execute(
				new ProlongApiKeyCommand(
					apiKeyRow.id,
					apiKeyRow.type,
					apiKeyRow.expiration,
					apiKeyRow.expires_at,
				),
			)
		})

		return new ResponseOk(new VerifyResult(apiKeyRow.identity_id, apiKeyRow.id, apiKeyRow.roles, apiKeyRow.person_id))
	}

	async createSessionApiKey(dbContext: DatabaseContext, identityId: string, expiration?: number): Promise<string> {
		const config = await dbContext.queryHandler.fetch(new ConfigurationQuery())
		const expirationResolved = expiration ?? (intervalToSeconds(config.login.defaultTokenExpiration) / 60)
		const expirationCapped = config.login.maxTokenExpiration ? Math.min(expirationResolved, intervalToSeconds(config.login.maxTokenExpiration) / 60) : expirationResolved
		const command = new CreateApiKeyCommand({ type: ApiKey.Type.SESSION, identityId, expiration: expirationCapped })
		const token = (await dbContext.commandBus.execute(command)).token
		assert(token !== undefined)
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
	): Promise<CreateApiKeyResponse> {
		return await dbContext.transaction(async db => {
			return await this.apiKeyService.createPermanentApiKey(db, description, roles, tokenHash)
		})
	}

	async createProjectPermanentApiKey(
		dbContext: DatabaseContext,
		projectId: string,
		memberships: readonly Acl.Membership[],
		description: string,
		tokenHash?: TokenHash,
	): Promise<CreateApiKeyResponse> {
		return await dbContext.transaction(async db => {
			return await this.apiKeyService.createProjectPermanentApiKey(db, projectId, memberships, description, tokenHash)
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
	) {}
}

export const enum VerifyErrorCode {
	NOT_FOUND = 'not_found',
	DISABLED = 'disabled',
	EXPIRED = 'expired',
	NO_AUTH_HEADER = 'no_auth_header',
	INVALID_AUTH_HEADER = 'invalid_auth_header',
}
