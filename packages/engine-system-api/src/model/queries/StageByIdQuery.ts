import { DatabaseQuery } from '@contember/database'
import { DatabaseQueryable } from '@contember/database'
import { SelectBuilder, LockType } from '@contember/database'
import { StageWithId } from '../dtos/Stage'
import { prepareStageQueryBuilder } from './StageQueryFactory'

class StageByIdQuery extends DatabaseQuery<StageByIdQuery.Result> {
	constructor(private readonly stageId: string, private readonly forUpdate: boolean = false) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<StageByIdQuery.Result> {
		let selectBuilder: SelectBuilder<StageByIdQuery.Result, any> = prepareStageQueryBuilder().where({
			id: this.stageId,
		})

		if (this.forUpdate) {
			selectBuilder = selectBuilder.lock(LockType.forNoKeyUpdate)
		}

		const rows = await selectBuilder.getResult(queryable.db)

		return this.fetchOneOrNull(rows)
	}
}

namespace StageByIdQuery {
	export type Result = null | StageWithId
}

export { StageByIdQuery }
