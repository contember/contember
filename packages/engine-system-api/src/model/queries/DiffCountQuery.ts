import { DatabaseQuery, DatabaseQueryable } from '@contember/database'
import { DiffErrorCode } from '../../schema'

class DiffCountQuery extends DatabaseQuery<DiffCountQuery.Response> {
	constructor(private readonly baseEvent: string, private readonly headEvent: string) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<DiffCountQuery.Response> {
		const diff = await queryable.db.query<{ index: number }>(
			`WITH RECURSIVE events(id, previous_id, index) AS (
    SELECT id, previous_id, 0
    FROM system.event
    WHERE id = ?
    UNION ALL
    SELECT event.id, event.previous_id, index + 1
    FROM system.event, events
    WHERE event.id = events.previous_id
  )
SELECT index from events where events.id = ?
`,
			[this.headEvent, this.baseEvent],
		)

		return diff.rows.length === 0
			? new DiffCountQuery.ErrorResponse([DiffErrorCode.NotRebased])
			: new DiffCountQuery.OkResponse(diff.rows[0].index)
	}
}

namespace DiffCountQuery {
	export type Response = OkResponse | ErrorResponse

	export class ErrorResponse {
		public readonly ok: false = false

		constructor(public readonly errors: DiffErrorCode[]) {}
	}

	export class OkResponse {
		public readonly ok: true = true

		constructor(public readonly diff: number) {}
	}
}

export { DiffCountQuery }
