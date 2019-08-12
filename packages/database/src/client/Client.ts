import {
	Connection,
	DatabaseQueryable,
	DeleteBuilder,
	EventManager,
	InsertBuilder,
	SelectBuilder,
	UpdateBuilder,
} from '../'
import { QueryHandler } from '@contember/queryable'

class Client<ConnectionType extends Connection.Queryable & Connection.Transactional = Connection>
	implements Connection.Queryable {
	constructor(public readonly connection: Connection.ConnectionLike, public readonly schema: string) {}

	get eventManager(): EventManager {
		return this.connection.eventManager
	}

	public forSchema(schema: string): Client {
		return new Client(this.connection, schema)
	}

	async transaction<T>(transactionScope: (wrapper: Client) => Promise<T> | T): Promise<T> {
		return await this.connection.transaction(connection => transactionScope(new Client(connection, this.schema)))
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

	async query<Row extends Record<string, any>>(
		sql: string,
		parameters: any[] = [],
		meta: Record<string, any> = {},
		config: Connection.QueryConfig = {},
	): Promise<Connection.Result<Row>> {
		return this.connection.query<Row>(sql, parameters, meta, config)
	}

	createQueryHandler(): QueryHandler<DatabaseQueryable> {
		const handler = new QueryHandler(
			new DatabaseQueryable(this, {
				get(): QueryHandler<DatabaseQueryable> {
					return handler
				},
			}),
		)
		return handler
	}
}

export { Client }
