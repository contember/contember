import KnexQuery from '../../../core/knex/KnexQuery'
import KnexQueryable from '../../../core/knex/KnexQueryable'

class StageByIdForUpdateQuery extends KnexQuery<StageByIdForUpdateQuery.Result> {
	constructor(private readonly stageId: string) {
		super()
	}

	async fetch(queryable: KnexQueryable): Promise<StageByIdForUpdateQuery.Result> {
		const rows = await queryable
			.createWrapper()
			.selectBuilder<StageByIdForUpdateQuery.Result[]>()
			.select('id')
			.select('name')
			.select('slug')
			.select('event_id')
			.from('stage')
			.where({ id: this.stageId })
			.getResult()

		return this.fetchOneOrNull(rows)
	}
}

namespace StageByIdForUpdateQuery {
	export type Result = null | {
		readonly id: string
		readonly name: string
		readonly slug: string
		readonly event_id: string
	}
}

export default StageByIdForUpdateQuery
