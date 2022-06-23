import { DatabaseQuery, DatabaseQueryable } from '@contember/database'
import { prepareStageQueryBuilder } from './StageQueryFactory.js'
import { Stage } from '../../dtos/index.js'

class StageBySlugQuery extends DatabaseQuery<StageBySlugQuery.Result> {
	constructor(private readonly slug: string) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<StageBySlugQuery.Result> {
		let selectBuilder = prepareStageQueryBuilder().where({ slug: this.slug })

		const rows = await selectBuilder.getResult(queryable.db)

		return this.fetchOneOrNull(rows)
	}
}

namespace StageBySlugQuery {
	export type Result = null | Stage
}

export { StageBySlugQuery }
