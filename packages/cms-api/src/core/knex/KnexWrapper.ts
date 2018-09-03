import * as Knex from 'knex'
import QueryBuilder from './QueryBuilder'
import { Formatter, Value } from './types'

export default class KnexWrapper {
	constructor(public readonly knex: Knex) {}

	async transaction<T>(transactionScope: (wrapper: KnexWrapper) => Promise<T> | void): Promise<T> {
		return await this.knex.transaction(knex => transactionScope(new KnexWrapper(knex)))
	}

	queryBuilder(): QueryBuilder {
		return new QueryBuilder(this, this.knex.queryBuilder())
	}

	raw(sql: string, ...bindings: (Value | Knex.QueryBuilder)[]): Knex.Raw {
		return this.knex.raw(sql, bindings as any)
	}

	formatter(qb: Knex.QueryBuilder): Formatter {
		return (this.knex.client as any).formatter(qb) as Formatter
	}
}
