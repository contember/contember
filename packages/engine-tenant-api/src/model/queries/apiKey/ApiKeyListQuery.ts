import { DatabaseQuery, DatabaseQueryable, Operator, SelectBuilder } from '@contember/database'
import { ApiKey } from '../../type/index.js'

export interface ApiKeyListRow {
	readonly id: string
	readonly type: ApiKey.Type
	readonly disabled_at: Date | null
	readonly created_at: Date
	readonly last_used_at: Date | null
	readonly expires_at: Date | null
	readonly identity_id: string
	readonly description: string | null
}

const baseApiKeyListQuery = () =>
	SelectBuilder.create<ApiKeyListRow>()
		.select(['api_key', 'id'])
		.select(['api_key', 'type'])
		.select(['api_key', 'disabled_at'])
		.select(['api_key', 'created_at'])
		.select(['api_key', 'last_used_at'])
		.select(['api_key', 'expires_at'])
		.select(['api_key', 'identity_id'])
		.select(['identity', 'description'])
		.from('api_key')
		.join('identity', 'identity', on => on.columnsEq(['api_key', 'identity_id'], ['identity', 'id']))
		// Only integration keys — SESSION tokens are sign-in sessions (see Identity.sessions),
		// ONE_OFF are sign-up artifacts; neither belongs in a key-management listing.
		.where(it => it.compare(['api_key', 'type'], Operator.eq, ApiKey.Type.PERMANENT))
		.orderBy(['api_key', 'created_at'], 'desc')

/** Permanent API keys whose identity is a member of the given project. */
export class ProjectApiKeysQuery extends DatabaseQuery<ApiKeyListRow[]> {
	constructor(private readonly projectId: string) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<ApiKeyListRow[]> {
		return await baseApiKeyListQuery()
			.where(it =>
				it.exists(qb =>
					qb
						.from('project_membership')
						.where(expr => expr.columnsEq(['project_membership', 'identity_id'], ['api_key', 'identity_id']))
						.where({ project_id: this.projectId })
				)
			)
			.getResult(db)
	}
}

/** Permanent API keys whose identity has no project membership — i.e. global keys from createGlobalApiKey. */
export class GlobalApiKeysQuery extends DatabaseQuery<ApiKeyListRow[]> {
	async fetch({ db }: DatabaseQueryable): Promise<ApiKeyListRow[]> {
		return await baseApiKeyListQuery()
			.where(it =>
				it.not(not =>
					not.exists(qb =>
						qb
							.from('project_membership')
							.where(expr => expr.columnsEq(['project_membership', 'identity_id'], ['api_key', 'identity_id']))
					)
				)
			)
			.getResult(db)
	}
}
