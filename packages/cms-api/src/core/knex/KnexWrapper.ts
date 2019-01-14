import * as Knex from 'knex'
import QueryBuilder from './QueryBuilder'
import { Raw, Value } from './types'
import InsertBuilder from './InsertBuilder'
import DeleteBuilder from './DeleteBuilder'
import UpdateBuilder from './UpdateBuilder'
import SelectBuilder from './SelectBuilder'

export default class KnexWrapper {
	constructor(public readonly knex: Knex, public readonly schema: string) {}

	async transaction<T>(transactionScope: (wrapper: KnexWrapper) => Promise<T> | void): Promise<T> {
		return await this.knex.transaction(knex => transactionScope(new KnexWrapper(knex, this.schema)))
	}

	selectBuilder<Result = { [columnName: string]: any }[]>(): SelectBuilder<Result, never> {
		return SelectBuilder.create<Result>(this)
	}

	insertBuilder(): InsertBuilder.NewInsertBuilder {
		return InsertBuilder.create(this)
	}

	updateBuilder(): UpdateBuilder.NewUpdateBuilder {
		return UpdateBuilder.create(this)
	}

	deleteBuilder(): DeleteBuilder.NewDeleteBuilder {
		return DeleteBuilder.create(this)
	}

	raw(sql: string, ...bindings: (Value | Knex.QueryBuilder)[]): Raw {
		return this.knex.raw(sql, bindings as any) as Raw
	}
}
