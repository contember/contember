import QueryHandler from './QueryHandler'
import Queryable from './Queryable'
import DatabaseConnection from './DatabaseConnection'
import QueryHandlerAccessor from './QueryHandlerAccessor'
import Knex = require('knex')

export default class KnexQueryable implements Queryable {
  constructor(
    private readonly db: DatabaseConnection,
    private readonly handlerAccessor: QueryHandlerAccessor<KnexQueryable>,
  ) {}

  getHandler(): QueryHandler<KnexQueryable> {
    return this.handlerAccessor.get()
  }

  createQueryBuilder(): Knex.QueryBuilder {
    return this.db.queryBuilder()
  }
}
