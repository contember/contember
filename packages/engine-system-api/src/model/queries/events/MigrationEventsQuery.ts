import { DatabaseQuery, DatabaseQueryable } from '@contember/database'

class MigrationEventsQuery extends DatabaseQuery<MigrationEventsQuery.Result> {
	constructor(private readonly stageSlug: string) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<MigrationEventsQuery.Result> {
		const rows = (
			await queryable.db.query<MigrationEventsQuery.Row>(
				`
			WITH RECURSIVE recent_events(type, previous_id, data) AS (
					SELECT type, previous_id, data, created_at
					FROM system.event
					JOIN system.stage ON stage.event_id = event.id
					WHERE stage.slug = ?
				UNION ALL
					SELECT event.type, event.previous_id, event.data, event.created_at
					FROM system.event, recent_events
					WHERE event.id = recent_events.previous_id
			)
			SELECT *
			FROM recent_events
			WHERE type = 'run_migration'
		`,
				[this.stageSlug],
			)
		).rows

		return rows.reverse()
	}
}

namespace MigrationEventsQuery {
	export type Row = {
		readonly type: string
		readonly previous_id: string
		readonly created_at: Date
		readonly data: { version: string }
	}
	export type Result = Row[]
}

export { MigrationEventsQuery }
