import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'
import { ImplementationException } from '../../../utils'

export class LatestTransactionIdByStageQuery extends DatabaseQuery<string> {
	constructor(private readonly stageId: string) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<string> {
		const rows = await SelectBuilder.create<{ transaction_id: string }>()
			.from('stage_transaction')
			.select('transaction_id')
			.where({ stage_id: this.stageId })
			.orderBy('applied_at', 'desc')
			.limit(1)
			.getResult(queryable.db)

		if (rows.length !== 1) {
			throw new ImplementationException()
		}
		return rows[0].transaction_id
	}
}
