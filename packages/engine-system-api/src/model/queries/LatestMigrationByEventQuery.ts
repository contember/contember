import { DatabaseQuery } from '@contember/database'
import { DatabaseQueryable } from '@contember/database'

class LatestMigrationByEventQuery extends DatabaseQuery<LatestMigrationByEventQuery.Result> {
	constructor(private readonly eventId: string) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<LatestMigrationByEventQuery.Result> {
		const rows = (
			await queryable.db.query<LatestMigrationByEventQuery.Row>(
				`
			WITH RECURSIVE recent_events(type, previous_id, data) AS (
					SELECT type, previous_id, data
					FROM system.event
					WHERE event.id = ?
				UNION ALL
					SELECT event.type, event.previous_id, event.data
					FROM system.event, recent_events
					WHERE event.id = recent_events.previous_id
			)
			SELECT *
			FROM recent_events
			WHERE type = 'run_migration'
			LIMIT 1
		`,
				[this.eventId],
			)
		).rows

		return this.fetchOneOrNull(rows)
	}
}

namespace LatestMigrationByEventQuery {
	export type Row = {
		readonly type: string
		readonly previous_id: string
		readonly data: { version: string }
	}
	export type Result = null | Row
}

export default LatestMigrationByEventQuery
