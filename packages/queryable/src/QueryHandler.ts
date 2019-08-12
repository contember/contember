import { Query, Queryable } from './'

export class QueryHandler<Q extends Queryable<Q>> {
	constructor(private readonly queryable: Q) {}

	async fetch<R>(query: Query<Q, R>): Promise<R> {
		return await query.fetch(this.queryable)
	}
}
