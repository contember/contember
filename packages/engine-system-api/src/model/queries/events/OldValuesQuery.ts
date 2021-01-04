import { DatabaseQuery, DatabaseQueryable, Literal } from '@contember/database'
import { createEventsQueryBuilder } from './EventQueryHelpers'

export class OldValuesQuery extends DatabaseQuery<Record<string, any>> {
	constructor(private readonly headEvent: string, private readonly ids: string[]) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<Record<string, any>> {
		const qb = await createEventsQueryBuilder<{ id: string; values: any }>(qb => qb.where({ id: this.headEvent }))
			.with('history_events', qb =>
				qb
					.select(new Literal('*'))
					.from('recent_events')
					.where(expr => expr.in('id', this.ids)),
			)
			.with('row_events', qb =>
				qb
					.select(['recent_events', 'data'])
					.select(['recent_events', 'index'])
					.select(['recent_events', 'type'])
					.from('history_events')
					.join('recent_events', undefined, expr =>
						expr.raw(
							`history_events.data->'rowId' = recent_events.data->'rowId' AND history_events.data->'tableName' = recent_events.data->'tableName' AND history_events.id != recent_events.id`,
						),
					),
			)
			.with('updates', qb =>
				qb
					.select(expr => expr.raw('jsonb_object_agg(t.key, t.value ORDER BY row_events.index DESC)'), 'values')
					.select(['history_events', 'id'], 'event_id')
					.from('history_events')
					.join('row_events', 'row_events', expr =>
						expr.raw(
							`history_events.data->'tableName' = row_events.data->'tableName'
							and history_events.data->'rowId' = row_events.data->'rowId'
							and history_events.index < row_events.index
							and row_events.type = 'update'
						`,
						),
					)
					.join(new Literal(`jsonb_each(row_events.data->'values')`), 't', expr => expr.raw('true'))
					.groupBy(expr => expr.raw(`history_events.id`)),
			)
			.select(['history_events', 'id'])
			.select(expr => expr.raw(`creates.data->'values' ||  coalesce(updates.values, '{}'::jsonb)`), 'values')
			.from('history_events')
			.join('row_events', 'creates', expr =>
				expr.raw(
					`creates.data->'rowId' = history_events.data->'rowId' and creates.data->'tableName' = history_events.data->'tableName' and creates.type = 'create'`,
				),
			)
			.leftJoin('updates', 'updates', expr => expr.columnsEq(['updates', 'event_id'], ['history_events', 'id']))

		return Object.fromEntries((await qb.getResult(queryable.db)).map(it => [it.id, it.values]))
	}
}
