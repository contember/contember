import { QueryHandler } from './'

export interface Queryable<Q extends Queryable<Q>> {
	getHandler(): QueryHandler<Q>
}
