import { DatabaseQuery, DatabaseQueryable, Literal, Operator, SelectBuilder } from '@contember/database'

export class OldValuesQuery extends DatabaseQuery<Record<string, any>> {
	constructor(private readonly ids: string[]) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<Record<string, any>> {
		const qb = SelectBuilder.create()
			.select(expr => expr.raw('JSONB_OBJECT_AGG(values.key, values.value ORDER BY previous.created_at ASC)'), 'values')
			.select(['event_data', 'id'])
			.from('event_data')
			.join('event_data', 'previous', on => on
				.columnsEq(['event_data', 'row_ids'], ['previous', 'row_ids'])
				.compareColumns(['event_data', 'created_at'], Operator.gt, ['previous', 'created_at']),
			)
			.join(new Literal('JSONB_EACH(previous.values)'), 'values')
			.where(where => where.in(['event_data', 'id'], this.ids))
			.groupBy(['event_data', 'id'])

		return Object.fromEntries((await qb.getResult(queryable.db)).map(it => [it.id, it.values]))
	}
}
