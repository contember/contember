import * as crypto from 'crypto'
import KnexConnection from '../../../core/knex/KnexConnection'
import * as uuid from 'uuid'
import KnexQueryable from '../../../core/knex/KnexQueryable'
import QueryHandler from '../../../core/query/QueryHandler'
import ApiKey from '../type/ApiKey'
import ApiKeyByTokenQuery from '../queries/ApiKeyByTokenQuery'

class ApiKeyManager {
	constructor(private readonly queryHandler: QueryHandler<KnexQueryable>, private readonly db: KnexConnection) {}

	async verify(token: string): Promise<ApiKeyManager.VerifyResult> {
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

		return new ApiKeyManager.VerifyResultOk(apiKeyRow.identity_id)
	}

	async createSessionApiKey(identityId: string): Promise<string> {
		return await this.create(ApiKey.Type.SESSION, identityId)
	}

	private async create(type: ApiKey.Type, identityId: string): Promise<string> {
		const apiKeyId = uuid.v4()
		const token = await this.generateToken()
		const tokenHash = ApiKey.computeTokenHash(token)

		await this.db
			.queryBuilder()
			.into('tenant.api_key')
			.insert({
				id: apiKeyId,
				token_hash: tokenHash,
				type: type,
				identity_id: identityId,
				enabled: true,
				expires_at: this.getExpiration(type),
				created_at: new Date(),
			})

		return token
	}

	private generateToken(): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			crypto.randomBytes(20, (error, buffer) => {
				if (error) {
					reject(error)
				} else {
					resolve(buffer.toString('hex'))
				}
			})
		})
	}

	private getExpiration(type: ApiKey.Type): Date | null {
		switch (type) {
			case ApiKey.Type.PERMANENT:
				return null

			case ApiKey.Type.SESSION:
				return new Date(Date.now() + 30 * 60 * 1000)
		}
	}
}

namespace ApiKeyManager {
	export type VerifyResult = VerifyResultOk | VerifyResultError

	export class VerifyResultOk {
		readonly valid = true
		constructor(public readonly identityId: string) {}
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
}

export default ApiKeyManager
