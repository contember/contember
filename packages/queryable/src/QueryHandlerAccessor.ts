import { Queryable, QueryHandler } from './/index.js'

export interface QueryHandlerAccessor<Q extends Queryable<Q>> {
	get(): QueryHandler<Q>
}
