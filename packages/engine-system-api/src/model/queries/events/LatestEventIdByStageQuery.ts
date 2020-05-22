import { DatabaseQuery, DatabaseQueryable } from '@contember/database'
import { ImplementationException } from '../../../utils'

export class LatestEventIdByStageQuery extends DatabaseQuery<string> {
	constructor(private readonly stageSlug: string) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<string> {
		const rows = (
			await queryable.db.query<{ event_id: string }>(
				`SELECT event_id
         FROM system.stage
         WHERE stage.slug = ?
			`,
				[this.stageSlug],
			)
		).rows
		if (rows.length !== 1) {
			throw new ImplementationException()
		}
		return rows[0].event_id
	}
}
