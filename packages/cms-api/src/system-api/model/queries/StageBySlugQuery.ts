import DbQuery from '../../../core/knex/DbQuery'
import DbQueryable from '../../../core/knex/DbQueryable'
import { Stage } from '../dtos/Stage'
import { prepareStageQueryBuilder } from './StageQueryHelper'

class StageBySlugQuery extends DbQuery<StageBySlugQuery.Result> {
	constructor(private readonly slug: string) {
		super()
	}

	async fetch(queryable: DbQueryable): Promise<StageBySlugQuery.Result> {
		let selectBuilder = prepareStageQueryBuilder(queryable).where({ slug: this.slug })

		const rows = await selectBuilder.getResult()

		return this.fetchOneOrNull(rows)
	}
}

namespace StageBySlugQuery {
	export type Result = null | Stage
}

export default StageBySlugQuery
