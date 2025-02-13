import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'

export class LatestTransactionIdByStageQuery extends DatabaseQuery<string | null> {
	constructor(private readonly stageId: string) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<string | null> {
		const rows = await SelectBuilder.create<{ transaction_id: string }>()
			.from('stage_transaction')
			.select('transaction_id')
			.where({ stage_id: this.stageId })
			.orderBy('applied_at', 'desc')
			.limit(1)
			.getResult(queryable.db)

		return rows.length === 0 ? null : rows[0].transaction_id
	}
}
