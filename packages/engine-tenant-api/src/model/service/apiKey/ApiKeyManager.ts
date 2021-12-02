import {
	CreateApiKeyCommand,
	DisableApiKeyCommand,
	DisableIdentityApiKeysCommand,
	DisableOneOffApiKeyCommand,
	ProlongApiKeyCommand,
} from '../../commands'
import { ApiKey } from '../../type'
import { Membership } from '../../type/Membership'
import { ApiKeyByTokenQuery } from '../../queries'
import { Response, ResponseError, ResponseOk } from '../../utils/Response'
import { DatabaseContext } from '../../utils'
import { ApiKeyService, CreateApiKeyResponse } from './ApiKeyService'
import assert from 'assert'

export class ApiKeyManager {
	constructor(
		private readonly apiKeyService: ApiKeyService,
	) {}

	async verifyAndProlong(
		dbContext: DatabaseContext,
		token: string,
	): Promise<VerifyResponse> {
		const apiKeyRow = await dbContext.queryHandler.fetch(new ApiKeyByTokenQuery(token))
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
				new ProlongApiKeyCommand(apiKeyRow.id, apiKeyRow.type, apiKeyRow.expiration || undefined),
			)
		})

		return new ResponseOk(new VerifyResult(apiKeyRow.identity_id, apiKeyRow.id, apiKeyRow.roles))
	}

	async createSessionApiKey(dbContext: DatabaseContext, identityId: string, expiration?: number): Promise<string> {
		const command = new CreateApiKeyCommand({ type: ApiKey.Type.SESSION, identityId, expiration })
		const token = (await dbContext.commandBus.execute(command)).token
		assert(token !== undefined)
		return token
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
		tokenHash?: string,
	): Promise<CreateApiKeyResponse> {
		return await dbContext.transaction(async db => {
			return await this.apiKeyService.createPermanentApiKey(db, description, roles, tokenHash)
		})
	}

	async createProjectPermanentApiKey(
		dbContext: DatabaseContext,
		projectId: string,
		memberships: readonly Membership[],
		description: string,
		tokenHash?: string,
	): Promise<CreateApiKeyResponse> {
		return await dbContext.transaction(async db => {
			return await this.apiKeyService.createProjectPermanentApiKey(db, projectId, memberships, description, tokenHash)
		})
	}

}

export type VerifyResponse = Response<VerifyResult, VerifyErrorCode>

export class VerifyResult {
	readonly valid = true

	constructor(public readonly identityId: string, public readonly apiKeyId: string, public readonly roles: string[]) {}
}

export const enum VerifyErrorCode {
	NOT_FOUND = 'not_found',
	DISABLED = 'disabled',
	EXPIRED = 'expired',
	NO_AUTH_HEADER = 'no_auth_header',
	INVALID_AUTH_HEADER = 'invalid_auth_header',
}
