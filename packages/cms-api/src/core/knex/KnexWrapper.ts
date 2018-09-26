import * as Knex from 'knex'
import QueryBuilder from './QueryBuilder'
import { Formatter, Value } from './types'
import InsertBuilder from './InsertBuilder'
import DeleteBuilder from './DeleteBuilder'

export default class KnexWrapper {
	constructor(public readonly knex: Knex, private readonly schema: string) {}

	async transaction<T>(transactionScope: (wrapper: KnexWrapper) => Promise<T> | void): Promise<T> {
		return await this.knex.transaction(knex => transactionScope(new KnexWrapper(knex, this.schema)))
	}

	queryBuilder<R = { [columnName: string]: any }[]>(): QueryBuilder<R> {
		return new QueryBuilder(this, this.knex.queryBuilder(), this.schema)
	}

	insertBuilder(): InsertBuilder.NewInsertBuilder {
		return InsertBuilder.create(this, this.schema)
	}

	deleteBuilder(): DeleteBuilder.NewDeleteBuilder {
		return DeleteBuilder.create(this, this.schema)
	}

	raw(sql: string, ...bindings: (Value | Knex.QueryBuilder)[]): Knex.Raw {
		return this.knex.raw(sql, bindings as any)
	}

	formatter(qb: Knex.QueryBuilder): Formatter {
		return (this.knex.client as any).formatter(qb) as Formatter
	}
}
