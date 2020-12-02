import { DatabaseQueryable } from '@contember/database'
import { QueryHandler } from '@contember/queryable'
import {
	AddProjectMemberCommand,
	CommandBus,
	CreateApiKeyCommand,
	CreateIdentityCommand,
	DisableApiKeyCommand,
	DisableIdentityApiKeysCommand,
	DisableOneOffApiKeyCommand,
	ProlongApiKeyCommand,
} from '../commands'
import { ApiKey } from '../type'
import { ImplementationException } from '../../exceptions'
import { Membership } from '../type/Membership'
import { TenantRole } from '../authorization'
import { ApiKeyByTokenQuery } from '../queries'
import { createSetMembershipVariables } from './membershipUtils'
import { Response, ResponseError, ResponseOk } from '../utils/Response'

export class ApiKeyManager {
	constructor(
		private readonly queryHandler: QueryHandler<DatabaseQueryable>,
		private readonly commandBus: CommandBus,
	) {}

	async verifyAndProlong(token: string): Promise<VerifyResponse> {
		const apiKeyRow = await this.queryHandler.fetch(new ApiKeyByTokenQuery(token))
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
			await this.commandBus.execute(
				new ProlongApiKeyCommand(apiKeyRow.id, apiKeyRow.type, apiKeyRow.expiration || undefined),
			)
		})

		return new ResponseOk(new VerifyResult(apiKeyRow.identity_id, apiKeyRow.id, apiKeyRow.roles))
	}

	async createSessionApiKey(identityId: string, expiration?: number): Promise<string> {
		return (await this.commandBus.execute(new CreateApiKeyCommand(ApiKey.Type.SESSION, identityId, expiration))).token
	}

	async createLoginApiKey(): Promise<CreateApiKeyResult> {
		const response = await this.createGlobalApiKey([TenantRole.LOGIN])
		if (!response.ok) {
			throw new ImplementationException()
		}
		return response.result
	}

	async disableOneOffApiKey(apiKeyId: string): Promise<void> {
		await this.commandBus.execute(new DisableOneOffApiKeyCommand(apiKeyId))
	}

	async disableApiKey(apiKeyId: string): Promise<boolean> {
		return await this.commandBus.execute(new DisableApiKeyCommand(apiKeyId))
	}

	async disableIdentityApiKeys(identityId: string): Promise<void> {
		await this.commandBus.execute(new DisableIdentityApiKeysCommand(identityId))
	}

	async createProjectPermanentApiKey(
		projectId: string,
		memberships: readonly Membership[],
		description: string,
	): Promise<CreateApiKeyResponse> {
		return await this.commandBus.transaction(async bus => {
			const identityId = await bus.execute(new CreateIdentityCommand([], description))
			const apiKeyResult = await bus.execute(new CreateApiKeyCommand(ApiKey.Type.PERMANENT, identityId))

			const addMemberResult = await bus.execute(
				new AddProjectMemberCommand(projectId, identityId, createSetMembershipVariables(memberships)),
			)
			if (!addMemberResult.ok) {
				throw new ImplementationException()
			}

			return new ResponseOk(new CreateApiKeyResult(identityId, apiKeyResult))
		})
	}

	async createGlobalApiKey(roles: TenantRole[]): Promise<CreateApiKeyResponse> {
		return await this.commandBus.transaction(async bus => {
			const identityId = await bus.execute(new CreateIdentityCommand(roles))
			const apiKeyResult = await bus.execute(new CreateApiKeyCommand(ApiKey.Type.PERMANENT, identityId))

			return new ResponseOk(new CreateApiKeyResult(identityId, apiKeyResult))
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

export type CreateApiKeyResponse = Response<CreateApiKeyResult, never>

export class CreateApiKeyResult {
	constructor(public readonly identityId: string, public readonly apiKey: { id: string; token: string }) {}
}
