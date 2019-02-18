import KnexQueryable from '../../../core/knex/KnexQueryable'
import QueryHandler from '../../../core/query/QueryHandler'
import ApiKey from '../type/ApiKey'
import ApiKeyByTokenQuery from '../queries/ApiKeyByTokenQuery'
import KnexWrapper from '../../../core/knex/KnexWrapper'
import CreateIdentityCommand from '../commands/CreateIdentityCommand'
import Identity from '../type/Identity'
import CreateApiKey from '../commands/CreateApiKey'
import DisableOneOffApiKeyCommand from '../commands/DisableOneOffApiKeyCommand'
import ProlongApiKey from '../commands/ProlongApiKey'

class ApiKeyManager {
	constructor(private readonly queryHandler: QueryHandler<KnexQueryable>, private readonly db: KnexWrapper) {}

	async verifyAndProlong(token: string): Promise<ApiKeyManager.VerifyResult> {
		const apiKeyRow = await this.queryHandler.fetch(new ApiKeyByTokenQuery(token))
		if (apiKeyRow === null) {
			return new ApiKeyManager.VerifyResultError(ApiKeyManager.VerifyErrorCode.NOT_FOUND)
		}

		if (apiKeyRow.enabled !== true) {
			return new ApiKeyManager.VerifyResultError(ApiKeyManager.VerifyErrorCode.DISABLED)
		}

		const now = new Date()
		if (apiKeyRow.expires_at !== null && apiKeyRow.expires_at <= now) {
			return new ApiKeyManager.VerifyResultError(ApiKeyManager.VerifyErrorCode.EXPIRED)
		}
		await new ProlongApiKey(apiKeyRow.id, apiKeyRow.type, apiKeyRow.expiration || undefined).execute(this.db)

		return new ApiKeyManager.VerifyResultOk(apiKeyRow.identity_id, apiKeyRow.id, apiKeyRow.roles)
	}

	async createSessionApiKey(identityId: string, expiration?: number): Promise<string> {
		return (await new CreateApiKey(ApiKey.Type.SESSION, identityId, expiration).execute(this.db)).token
	}

	async createLoginApiKey(): Promise<ApiKeyManager.CreateLoginApiKeyResult> {
		return await this.db.transaction(async db => {
			const identityId = await new CreateIdentityCommand([Identity.SystemRole.LOGIN]).execute(db)
			const apiKeyResult = await new CreateApiKey(ApiKey.Type.PERMANENT, identityId).execute(db)
			return new ApiKeyManager.CreateLoginApiKeyResult(identityId, apiKeyResult)
		})
	}

	async disableOneOffApiKey(apiKeyId: string): Promise<void> {
		await new DisableOneOffApiKeyCommand(apiKeyId).execute(this.db)
	}
}

namespace ApiKeyManager {
	export type VerifyResult = VerifyResultOk | VerifyResultError

	export class VerifyResultOk {
		readonly valid = true
		constructor(
			public readonly identityId: string,
			public readonly apiKeyId: string,
			public readonly roles: string[]
		) {}
	}

	export class VerifyResultError {
		readonly valid = false
		constructor(public readonly error: VerifyErrorCode) {}
	}

	export const enum VerifyErrorCode {
		NOT_FOUND = 'not_found',
		DISABLED = 'disabled',
		EXPIRED = 'expired',
	}

	export class CreateLoginApiKeyResult {
		constructor(public readonly identityId: string, public readonly apiKey: CreateApiKey.Result) {}
	}
}

export default ApiKeyManager
