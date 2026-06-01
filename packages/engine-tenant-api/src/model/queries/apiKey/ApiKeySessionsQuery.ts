import { DatabaseQuery, DatabaseQueryable, Operator, SelectBuilder } from '@contember/database'
import { ApiKey } from '../../type/index.js'

export type ApiKeySessionRow = {
	readonly id: string
	readonly created_at: Date
	readonly expires_at: Date | null
	readonly last_used_at: Date | null
	readonly last_ip: string | null
	readonly last_user_agent: string | null
	readonly created_ip: string | null
	readonly created_user_agent: string | null
	readonly trust_forwarded_info: boolean
}

export class ApiKeySessionsByIdentityQuery extends DatabaseQuery<readonly ApiKeySessionRow[]> {
	constructor(
		private readonly identityId: string,
		private readonly options: { now: Date },
	) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<readonly ApiKeySessionRow[]> {
		const rows = await SelectBuilder.create<ApiKeySessionRow>()
			.select(['api_key', 'id'])
			.select(['api_key', 'created_at'])
			.select(['api_key', 'expires_at'])
			.select(['api_key', 'last_used_at'])
			.select(['api_key', 'last_ip'])
			.select(['api_key', 'last_user_agent'])
			.select(['api_key', 'created_ip'])
			.select(['api_key', 'created_user_agent'])
			.select(['api_key', 'trust_forwarded_info'])
			.from('api_key')
			.where(it => it.compare(['api_key', 'identity_id'], Operator.eq, this.identityId))
			.where(it => it.compare(['api_key', 'type'], Operator.eq, ApiKey.Type.SESSION))
			.where(it => it.isNull(['api_key', 'disabled_at']))
			.where(it =>
				it.or(or =>
					or.isNull(['api_key', 'expires_at'])
						.compare(['api_key', 'expires_at'], Operator.gt, this.options.now)
				)
			)
			.orderBy(['api_key', 'created_at'], 'desc')
			.getResult(db)

		return rows
	}
}
