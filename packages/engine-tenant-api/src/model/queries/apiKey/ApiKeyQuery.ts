import { DatabaseQuery, DatabaseQueryable, Operator, SelectBuilder } from '@contember/database'
import { ApiKey } from '../../type'
import { computeTokenHash } from '../../utils'

export class ApiKeyByIdQuery extends DatabaseQuery<null | ApiKeyRow> {
	constructor(private readonly apiKeyId: string) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<null | ApiKeyRow> {
		const rows = await apiKeyBaseQuery
			.where(
				where => where.compare(['api_key', 'id'], Operator.eq, this.apiKeyId),
			)
			.getResult(db)

		return this.fetchOneOrNull(rows)
	}
}

export class ApiKeyByTokenQuery extends DatabaseQuery<null | ApiKeyRow> {
	constructor(private readonly token: string) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<null | ApiKeyRow> {
		const tokenHash = computeTokenHash(this.token)
		const rows = await apiKeyBaseQuery
			.where({ token_hash: tokenHash })
			.getResult(db)

		return this.fetchOneOrNull(rows)
	}
}

export type ApiKeyRow = {
	readonly id: string
	readonly type: ApiKey.Type
	readonly identity_id: string
	readonly disabled_at: Date | null
	readonly expires_at: Date | null
	readonly expiration: number | null
	readonly roles: string[]
	readonly person_id: string | null
}

const apiKeyBaseQuery = SelectBuilder.create<null | ApiKeyRow>()
	.select(['api_key', 'id'])
	.select(['api_key', 'type'])
	.select(['api_key', 'identity_id'])
	.select(['api_key', 'disabled_at'])
	.select(['api_key', 'expires_at'])
	.select(['identity', 'roles'])
	.select(['api_key', 'expiration'])
	.select(['person', 'id'], 'person_id')
	.from('api_key')
	.join('identity', 'identity', joinClause =>
		joinClause.compareColumns(['api_key', 'identity_id'], Operator.eq, ['identity', 'id']),
	)
	.leftJoin(
		'person', 'person', on => on.compareColumns(
			['person', 'identity_id'], Operator.eq, ['identity', 'id'],
		),
	)
