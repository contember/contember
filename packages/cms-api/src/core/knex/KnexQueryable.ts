import QueryHandler from '../query/QueryHandler'
import Queryable from '../query/Queryable'
import KnexConnection from './KnexConnection'
import QueryHandlerAccessor from '../query/QueryHandlerAccessor'
import * as Knex from 'knex'

export default class KnexQueryable implements Queryable<KnexQueryable> {
	constructor(
		private readonly db: KnexConnection,
		private readonly handlerAccessor: QueryHandlerAccessor<KnexQueryable>
	) {}

	getHandler(): QueryHandler<KnexQueryable> {
		return this.handlerAccessor.get()
	}

	createQueryBuilder(): Knex.QueryBuilder {
		return this.db.queryBuilder()
	}
}
