import KnexQuery from '../../../core/knex/KnexQuery'
import KnexQueryable from '../../../core/knex/KnexQueryable'

class InitEventQuery extends KnexQuery<InitEventQuery.InitEvent> {
	async fetch(queryable: KnexQueryable): Promise<InitEventQuery.InitEvent> {
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
