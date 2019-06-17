import DbQuery from '../../../core/database/DbQuery'
import DbQueryable from '../../../core/database/DbQueryable'
import SelectBuilder from '../../../core/database/SelectBuilder'
import { Stage } from '../dtos/Stage'
import { prepareStageQueryBuilder } from './StageQueryHelper'

class StageByIdQuery extends DbQuery<StageByIdQuery.Result> {
	constructor(private readonly stageId: string, private readonly forUpdate: boolean = false) {
		super()
	}

	async fetch(queryable: DbQueryable): Promise<StageByIdQuery.Result> {
		let selectBuilder: SelectBuilder<StageByIdQuery.Result, any> = prepareStageQueryBuilder(queryable).where({
			id: this.stageId,
		})

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
