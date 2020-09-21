import { DatabaseQuery, DatabaseQueryable } from '@contember/database'

type MatrixRow = {
	stage_a_slug: string
	stage_b_slug: string
	stage_a_event_id: string
	stage_b_event_id: string
	common_event_id: string
	distance: number
}

class StageCommonEventsMatrixQuery extends DatabaseQuery<StageCommonEventsMatrixQuery.Result> {
	constructor() {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<StageCommonEventsMatrixQuery.Result> {
		const res = await queryable.db.query<MatrixRow>(`
			WITH RECURSIVE
				events(id, previous_id, index, stage) AS (
					SELECT event.id, previous_id, 0, stage.id
					FROM system.event
						     JOIN system.stage ON stage.event_id = event.id
					UNION ALL
					SELECT event.id, event.previous_id, index + 1, events.stage
					FROM events
						     JOIN system.event ON events.previous_id = event.id
				),
				stages AS (
					SELECT stageA.slug AS stage_a_slug,
						stageA.id AS stage_a_id,
						stageA.event_id AS stage_a_event_id,
						stageB.slug AS stage_b_slug,
						stageB.id AS stage_b_id,
						stageB.event_id AS stage_b_event_id
					FROM system.stage stageA
						     JOIN system.stage stageB ON TRUE
				),
				matrix AS (
					SELECT stages.stage_a_slug,
						stages.stage_a_event_id,
						stages.stage_b_slug,
						stages.stage_b_event_id,
						eventsA.index AS distance,
						eventsA.id AS common_event_id,
						row_number() OVER (PARTITION BY stages.stage_a_id, stages.stage_b_id ORDER BY eventsA.index) AS num
					FROM stages
						     JOIN events eventsA ON eventsA.stage = stages.stage_a_id
						     JOIN events eventsB ON eventsB.id = eventsA.id AND eventsB.stage = stages.stage_b_id
				)
			SELECT stage_a_slug, stage_a_event_id, stage_b_slug, stage_b_event_id, distance, common_event_id
			FROM matrix
			WHERE num = 1
		`)
		const rows = res.rows
		const result: StageCommonEventsMatrixQuery.Result = {}
		for (const row of rows) {
			result[row.stage_a_slug] = result[row.stage_a_slug] || {}
			result[row.stage_a_slug][row.stage_b_slug] = {
				commonEventId: row.common_event_id,
				stageAEventId: row.stage_a_event_id,
				stageBEventId: row.stage_b_event_id,
				distance: row.distance,
			}
		}

		return result
	}
}

namespace StageCommonEventsMatrixQuery {
	export type Result = {
		[stageASlug: string]: {
			[stageBSlug: string]: {
				stageAEventId: string
				stageBEventId: string
				commonEventId: string
				distance: number
			}
		}
	}
}

export { StageCommonEventsMatrixQuery }
