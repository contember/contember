import DbQuery from '../../../core/knex/DbQuery'
import DbQueryable from '../../../core/knex/DbQueryable'

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
