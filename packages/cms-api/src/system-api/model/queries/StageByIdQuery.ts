import KnexQuery from '../../../core/knex/KnexQuery'
import KnexQueryable from '../../../core/knex/KnexQueryable'
import SelectBuilder from '../../../core/knex/SelectBuilder'

class StageByIdQuery extends KnexQuery<StageByIdQuery.Result> {
	constructor(
		private readonly stageId: string,
		private readonly forUpdate: boolean) {
		super()
	}

	async fetch(queryable: KnexQueryable): Promise<StageByIdQuery.Result> {
		let selectBuilder = queryable
			.createSelectBuilder<StageByIdQuery.Result>()
			.select('id')
			.select('name')
			.select('slug')
			.select('event_id')
			.from('stage')
			.where({ id: this.stageId })

		if (this.forUpdate) {
			selectBuilder = selectBuilder.lock(SelectBuilder.LockType.forNoKeyUpdate)
		}

		const rows = await selectBuilder.getResult()

		return this.fetchOneOrNull(rows)
	}
}

namespace StageByIdQuery {
	export type Result = null | {
		readonly id: string
		readonly name: string
		readonly slug: string
		readonly event_id: string
	}
}

export default StageByIdQuery
