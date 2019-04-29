import DbQuery from '../../../core/database/DbQuery'
import DbQueryable from '../../../core/database/DbQueryable'

class InitEventQuery extends DbQuery<InitEventQuery.InitEvent> {
	async fetch(queryable: DbQueryable): Promise<InitEventQuery.InitEvent> {
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
