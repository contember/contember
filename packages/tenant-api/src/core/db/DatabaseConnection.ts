import * as Knex from "knex"
import * as Bluebird from 'bluebird'

export default class DatabaseConnection {
  constructor(
    private readonly knex: Knex,
  ) {}

  transaction<T>(transactionScope: (trx: Knex.Transaction) => Promise<T> | Bluebird<T> | void): PromiseLike<T> {
    return this.knex.transaction(transactionScope)
  }

  queryBuilder(): Knex.QueryBuilder {
    return this.knex.queryBuilder()
  }
}
