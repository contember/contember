import { QueryHandler } from './/index.js'

export interface Queryable<Q extends Queryable<Q>> {
	getHandler(): QueryHandler<Q>
}
