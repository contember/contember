import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'

class InitEventQuery extends DatabaseQuery<InitEventQuery.InitEvent> {
	async fetch(queryable: DatabaseQueryable): Promise<InitEventQuery.InitEvent> {
		return (
			await SelectBuilder.create<InitEventQuery.InitEvent>()
				.from('event')
				.select('id')
				.where({ type: 'init' })
				.getResult(queryable.db)
		)[0]
	}
}

namespace InitEventQuery {
	export interface InitEvent {
		id: string
	}
}

export { InitEventQuery }
