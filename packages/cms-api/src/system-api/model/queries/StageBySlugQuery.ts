import { DatabaseQuery } from '@contember/database'
import { DatabaseQueryable } from '@contember/database'
import { Stage } from '../dtos/Stage'
import { prepareStageQueryBuilder } from './StageQueryHelper'

class StageBySlugQuery extends DatabaseQuery<StageBySlugQuery.Result> {
	constructor(private readonly slug: string) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<StageBySlugQuery.Result> {
		let selectBuilder = prepareStageQueryBuilder(queryable).where({ slug: this.slug })

		const rows = await selectBuilder.getResult()

		return this.fetchOneOrNull(rows)
	}
}

namespace StageBySlugQuery {
	export type Result = null | Stage
}

export default StageBySlugQuery
