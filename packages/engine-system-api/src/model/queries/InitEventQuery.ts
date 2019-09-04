import { DatabaseQuery } from '@contember/database'
import { DatabaseQueryable } from '@contember/database'

class InitEventQuery extends DatabaseQuery<InitEventQuery.InitEvent> {
	async fetch(queryable: DatabaseQueryable): Promise<InitEventQuery.InitEvent> {
		return (await queryable
			.createSelectBuilder<InitEventQuery.InitEvent>()
			.from('event')
			.select('id')
			.where({ type: 'init' })
			.getResult())[0]
	}
}

namespace InitEventQuery {
	export interface InitEvent {
		id: string
	}
}

export default InitEventQuery
