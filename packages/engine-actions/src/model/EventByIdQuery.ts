import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'
import { EventRow } from './types'

export class EventByIdQuery extends DatabaseQuery<EventRow | null> {
	constructor(
		private readonly id: string,
	) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<EventRow | null> {
		const result = await SelectBuilder.create<EventRow>()
			.from('actions_event')
			.select('*')
			.where({
				id: this.id,
			})
			.getResult(queryable.db)
		return this.fetchOneOrNull(result)
	}
}
