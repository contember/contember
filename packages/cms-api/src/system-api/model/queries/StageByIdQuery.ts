import { DatabaseQuery } from '@contember/database'
import { DatabaseQueryable } from '@contember/database'
import { SelectBuilder } from '@contember/database'
import { Stage } from '../dtos/Stage'
import { prepareStageQueryBuilder } from './StageQueryHelper'

class StageByIdQuery extends DatabaseQuery<StageByIdQuery.Result> {
	constructor(private readonly stageId: string, private readonly forUpdate: boolean = false) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<StageByIdQuery.Result> {
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
