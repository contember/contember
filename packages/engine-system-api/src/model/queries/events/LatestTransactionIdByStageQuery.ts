import { DatabaseQuery, DatabaseQueryable } from '@contember/database'
import { ImplementationException } from '../../../utils/index.js'

export class LatestTransactionIdByStageQuery extends DatabaseQuery<string> {
	constructor(private readonly stageSlug: string) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<string> {
		const stageId = (
			await queryable.db.query<{ id: string }>(
				`
				SELECT id
				FROM system.stage
				WHERE slug = ?
				`,
				[this.stageSlug],
			)
		).rows[0].id
		const rows = (
			await queryable.db.query<{ transaction_id: string }>(
				`
				SELECT transaction_id
				FROM system.stage_transaction
				WHERE stage_id = ?
				ORDER BY applied_at DESC
				LIMIT 1
				`,
				[stageId],
			)
		).rows
		if (rows.length !== 1) {
			throw new ImplementationException()
		}
		return rows[0].transaction_id
	}
}
