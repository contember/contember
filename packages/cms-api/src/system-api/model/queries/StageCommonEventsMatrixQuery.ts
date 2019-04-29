import DbQuery from '../../../core/database/DbQuery'
import DbQueryable from '../../../core/database/DbQueryable'

class StageCommonEventsMatrixQuery extends DbQuery<StageCommonEventsMatrixQuery.Result> {
	constructor() {
		super()
	}

	async fetch(queryable: DbQueryable): Promise<StageCommonEventsMatrixQuery.Result> {
		const rows = (await queryable.createWrapper().query<{
			stage_a_id: string
			stage_b_id: string
			stage_a_event_id: string
			stage_b_event_id: string
			common_event_id: string
			distance: number
		}>(
			`WITH RECURSIVE events(id, previous_id, index, stage) AS (
  SELECT event.id, previous_id, 0, stage.id
  FROM system.event
         JOIN system.stage ON stage.event_id = event.id
  UNION ALL
  SELECT event.id, event.previous_id, index + 1, events.stage
  FROM events
         JOIN system.event ON events.previous_id = event.id
), matrix AS (
  SELECT stageA.id AS stage_a_id,
    stageA.event_id AS stage_a_event_id,
    stageB.id AS stage_b_id,
    stageB.event_id AS stage_b_event_id,
    eventsA.index AS distance,
    eventsA.id AS common_event_id,
    row_number() OVER (PARTITION BY stageA.id, stageB.id ORDER BY eventsA.index) AS num
  FROM system.stage stageA
         JOIN system.stage stageB ON TRUE
         JOIN events eventsA ON eventsA.stage = stageA.id
         JOIN events eventsB ON eventsB.stage = stageB.id AND eventsB.id = eventsA.id
)
SELECT stage_a_id, stage_a_event_id, stage_b_id, stage_b_event_id, distance, common_event_id
FROM matrix
WHERE num = 1
`
		)).rows
		const result: StageCommonEventsMatrixQuery.Result = {}
		for (const row of rows) {
			result[row.stage_a_id] = result[row.stage_a_id] || {}
			result[row.stage_a_id][row.stage_b_id] = {
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
		[stageA: string]: {
			[stageB: string]: {
				stageAEventId: string
				stageBEventId: string
				commonEventId: string
				distance: number
			}
		}
	}
}

export default StageCommonEventsMatrixQuery
