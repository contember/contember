import KnexQuery from '../../../core/knex/KnexQuery'
import KnexQueryable from '../../../core/knex/KnexQueryable'
import SelectBuilder from '../../../core/knex/SelectBuilder'
import { Stage } from '../dtos/Stage'
import { prepareStageQueryBuilder } from './StageQueryHelper'

class StageByIdQuery extends KnexQuery<StageByIdQuery.Result> {
	constructor(private readonly stageId: string, private readonly forUpdate: boolean = false) {
		super()
	}

	async fetch(queryable: KnexQueryable): Promise<StageByIdQuery.Result> {
		let selectBuilder = prepareStageQueryBuilder(queryable)
			.where({ id: this.stageId })

		if (this.forUpdate) {
			selectBuilder = selectBuilder.lock(SelectBuilder.LockType.forNoKeyUpdate)
		}

		const rows = await selectBuilder.getResult()

		return this.fetchOneOrNull(rows)
	}
}

namespace StageByIdQuery {
	export type Result = null | Stage
}

export default StageByIdQuery
