import { Queryable, QueryHandler } from './'

export interface QueryHandlerAccessor<Q extends Queryable<Q>> {
	get(): QueryHandler<Q>
}
