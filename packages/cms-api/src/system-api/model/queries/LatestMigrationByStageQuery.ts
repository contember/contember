import DbQuery from '../../../core/knex/DbQuery'
import DbQueryable from '../../../core/knex/DbQueryable'

class LatestMigrationByStageQuery extends DbQuery<LatestMigrationByStageQuery.Result> {
	constructor(private readonly stageId: string) {
		super()
	}

	async fetch(queryable: DbQueryable): Promise<LatestMigrationByStageQuery.Result> {
		const rows = (await queryable.wrapper.query< LatestMigrationByStageQuery.Row>(
			`
			WITH RECURSIVE recent_events(type, previous_id, data) AS (
					SELECT type, previous_id, data
					FROM system.event
					JOIN system.stage ON stage.event_id = event.id
					WHERE stage.id = ?
				UNION ALL
					SELECT event.type, event.previous_id, event.data
					FROM system.event, recent_events
					WHERE event.id = recent_events.previous_id
			)
			SELECT *
			FROM recent_events
			WHERE type = 'run_migration'
			LIMIT 1
		`, [this.stageId])).rows

		return this.fetchOneOrNull(rows)
	}
}

namespace LatestMigrationByStageQuery {
	export type Row = {
		readonly type: string
		readonly previous_id: string
		readonly data: { version: string }
	}
	export type Result = null | Row
}

export default LatestMigrationByStageQuery
