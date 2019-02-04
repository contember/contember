import KnexQuery from '../../../core/knex/KnexQuery'
import KnexQueryable from '../../../core/knex/KnexQueryable'
import { Stage } from '../dtos/Stage'
import { prepareStageQueryBuilder } from './StageQueryHelper'

class StageBySlugQuery extends KnexQuery<StageBySlugQuery.Result> {
	constructor(private readonly slug: string) {
		super()
	}

	async fetch(queryable: KnexQueryable): Promise<StageBySlugQuery.Result> {
		let selectBuilder = prepareStageQueryBuilder(queryable)
			.where({ slug: this.slug })

		const rows = await selectBuilder.getResult()

		return this.fetchOneOrNull(rows)
	}
}

namespace StageBySlugQuery {
	export type Result = null | Stage
}

export default StageBySlugQuery
