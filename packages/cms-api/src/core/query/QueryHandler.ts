import Query from './Query'
import Queryable from './Queryable'

export default class QueryHandler<Q extends Queryable<Q>> {
	constructor(private readonly queryable: Q) {}

	async fetch<R>(query: Query<Q, R>): Promise<R> {
		return await query.fetch(this.queryable)
	}
}
