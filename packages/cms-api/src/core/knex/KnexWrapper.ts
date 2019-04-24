import { Value } from './types'
import InsertBuilder from './InsertBuilder'
import DeleteBuilder from './DeleteBuilder'
import UpdateBuilder from './UpdateBuilder'
import SelectBuilder from './SelectBuilder'
import Connection from './Connection'
import QueryHandler from '../query/QueryHandler'
import KnexQueryable from './KnexQueryable'

class KnexWrapper<ConnectionType extends Connection.Queryable & Connection.Transactional = Connection>
implements Connection.Queryable{
	constructor(public readonly connection: Connection.ConnectionLike, public readonly schema: string) {
	}

	public forSchema(schema: string): KnexWrapper {
		return new KnexWrapper(this.connection, schema)
	}

	async transaction<T>(transactionScope: (wrapper: KnexWrapper) => Promise<T> | T): Promise<T> {
		return await this.connection.transaction(connection => transactionScope(new KnexWrapper(connection, this.schema)))
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

	async raw(sql: string, ...bindings: Value[]): Promise<Connection.Result> {
		return this.connection.query(sql, bindings as any)
	}

	async query(sql: string, parameters: any[], meta: Record<string, any> = {}, config: Connection.QueryConfig = {}): Promise<Connection.Result> {
		return this.connection.query(sql, parameters, meta, config)
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

export default KnexWrapper
