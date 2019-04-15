import Knex from 'knex'
import { Raw, Value } from './types'
import InsertBuilder from './InsertBuilder'
import DeleteBuilder from './DeleteBuilder'
import UpdateBuilder from './UpdateBuilder'
import SelectBuilder from './SelectBuilder'
import QueryHandler from '../query/QueryHandler'
import KnexQueryable from './KnexQueryable'
import KnexConnection from './KnexConnection'

class KnexWrapper<KnexType extends Knex = Knex> {
	constructor(public readonly knex: KnexType, public readonly schema: string) {}

	public forSchema(schema: string): KnexWrapper {
		return new KnexWrapper(this.knex, schema)
	}

	async transaction<T>(
		transactionScope: (wrapper: KnexWrapper & KnexWrapper.Transaction) => Promise<T> | void
	): Promise<T> {
		return await this.knex.transaction(knex => transactionScope(new KnexWrapper(knex, this.schema)))
	}

	selectBuilder<Result = SelectBuilder.Result>(): SelectBuilder<Result, never> {
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

	createQueryHandler(): QueryHandler<KnexQueryable> {
		const handler = new QueryHandler(
			new KnexQueryable(new KnexConnection(this.knex, this.schema), {
				get(): QueryHandler<KnexQueryable> {
					return handler
				},
			})
		)
		return handler
	}
}

namespace KnexWrapper {
	export interface Transaction {
		knex: Knex.Transaction
	}
}

export default KnexWrapper
