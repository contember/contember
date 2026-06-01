import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'
import { EventRow } from './types.js'
import { EventArgs } from '../graphql/schema/index.js'
import { eventsToProcessSpecification } from './EventsToProcessSpecification.js'

export class EventsToProcessQuery extends DatabaseQuery<EventRow[]> {
	constructor(
		private readonly args: EventArgs,
	) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<EventRow[]> {
		return SelectBuilder.create<EventRow>()
			.from('actions_event')
			.select('*')
			.match(eventsToProcessSpecification)
			.limit(this.args.limit ?? 100, this.args.offset ?? 0)
			.getResult(queryable.db)
	}
}
