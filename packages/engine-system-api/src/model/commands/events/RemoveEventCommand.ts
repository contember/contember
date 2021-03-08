import { DeleteBuilder, SelectBuilder, UpdateBuilder } from '@contember/database'
import { Command } from '../Command'

export class RemoveEventCommand implements Command<void> {
	constructor(private readonly ids: string[]) {}

	public async execute({ db }: Command.Args): Promise<void> {
		// rollback stage
		await SelectBuilder.create()
			.withRecursive('previous', qb =>
				qb
					.select(['stage', 'id'])
					.select('previous_id')
					.select(expr => expr.raw('0'), 'index')
					.from('stage')
					.join('event', 'event', expr => expr.columnsEq(['stage', 'event_id'], ['event', 'id']))
					.where(expr => expr.in(['event', 'id'], this.ids))
					.unionAll(qb =>
						qb
							.select(['previous', 'id'])
							.select(['event', 'previous_id'])
							.select(expr => expr.raw('previous.index + 1'), 'index')
							.from('event')
							.join('previous', undefined, expr => expr.columnsEq(['previous', 'previous_id'], ['event', 'id']))
							.where(expr => expr.in(['previous', 'previous_id'], this.ids)),
					),
			)
			.with('new_ids', qb =>
				qb.distinct('id').select('id').select('previous_id').from('previous').orderBy('id').orderBy('index', 'desc'),
			)
			.with(
				'update',
				UpdateBuilder.create()
					.table('stage')
					.values({ event_id: expr => expr.select(['new_ids', 'previous_id']) })
					.from(qb => qb.from('new_ids').where(expr => expr.columnsEq(['stage', 'id'], ['new_ids', 'id'])))
					.returning(['stage', 'id']),
			)
			.from('update')
			.getResult(db)

		// delete events
		await SelectBuilder.create()
			.withRecursive('previous', qb =>
				qb
					.select('id')
					.select('previous_id')
					.select(expr => expr.raw('0'), 'index')
					.from('event')
					.where(expr => expr.in('previous_id', this.ids))
					.where(expr => expr.not(expr => expr.in('id', this.ids)))
					.unionAll(qb =>
						qb
							.select(['previous', 'id'])
							.select(['event', 'previous_id'])
							.select(expr => expr.raw('previous.index + 1'), 'index')
							.from('event')
							.join('previous', undefined, expr => expr.columnsEq(['previous', 'previous_id'], ['event', 'id']))
							.where(expr => expr.in(['previous', 'previous_id'], this.ids)),
					),
			)
			.with('new_ids', qb =>
				qb.distinct('id').select('id').select('previous_id').from('previous').orderBy('id').orderBy('index', 'desc'),
			)

			.with(
				'updates',
				UpdateBuilder.create()
					.table('event')
					.values({ previous_id: expr => expr.select(['new_ids', 'previous_id']) })
					.from(qb => qb.from('new_ids').where(expr => expr.columnsEq(['event', 'id'], ['new_ids', 'id'])))
					.returning(['event', 'id']),
			)
			.with(
				'deletes',
				DeleteBuilder.create()
					.from('event')
					.where(expr => expr.in('id', this.ids))
					.returning('id'),
			)
			.from('updates')
			.unionAll(qb => qb.from('deletes'))
			.getResult(db)
	}
}
