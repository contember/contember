import KnexQuery from '../../../core/knex/KnexQuery'
import KnexQueryable from '../../../core/knex/KnexQueryable'

class LatestMigrationByStageQuery extends KnexQuery<LatestMigrationByStageQuery.Result> {
	constructor(private readonly stageId: string) {
		super()
	}

	async fetch(queryable: KnexQueryable): Promise<LatestMigrationByStageQuery.Result> {
		const rows = (await queryable.createWrapper().raw(
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
		`,
			this.stageId
		)).rows

		return this.fetchOneOrNull(rows)
	}
}

namespace LatestMigrationByStageQuery {
	export type Result = null | {
		readonly type: string
		readonly previous_id: string
		readonly data: { version: string }
	}
}

export default LatestMigrationByStageQuery
