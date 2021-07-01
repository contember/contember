import { DeleteBuilder, InsertBuilder, SelectBuilder, UpdateBuilder } from '../builders'
import { DatabaseQueryable } from '../queryable'
import { Connection } from './Connection'
import { EventManager } from './EventManager'
import { QueryHandler } from '@contember/queryable'

class Client<ConnectionType extends Connection.ConnectionLike = Connection.ConnectionLike>
	implements Connection.Queryable
{
	constructor(
		public readonly connection: ConnectionType,
		public readonly schema: string,
		public readonly queryMeta: Record<string, any>,
	) {}

	get eventManager(): EventManager {
		return this.connection.eventManager
	}

	public forSchema(schema: string): Client<ConnectionType> {
		return new Client<ConnectionType>(this.connection, schema, this.queryMeta)
	}

	async transaction<T>(transactionScope: (wrapper: Client<Connection.TransactionLike>) => Promise<T> | T): Promise<T> {
		return await this.connection.transaction(connection =>
			transactionScope(new Client<Connection.TransactionLike>(connection, this.schema, this.queryMeta)),
		)
	}

	selectBuilder<Result = SelectBuilder.Result>(): SelectBuilder<Result> {
		return SelectBuilder.create<Result>()
	}

	insertBuilder(): InsertBuilder<InsertBuilder.AffectedRows> {
		return InsertBuilder.create()
	}

	updateBuilder(): UpdateBuilder<UpdateBuilder.AffectedRows> {
		return UpdateBuilder.create()
	}

	deleteBuilder(): DeleteBuilder<DeleteBuilder.AffectedRows> {
		return DeleteBuilder.create()
	}

	async query<Row extends Record<string, any>>(
		sql: string,
		parameters: any[] = [],
		meta: Record<string, any> = {},
		config: Connection.QueryConfig = {},
	): Promise<Connection.Result<Row>> {
		return this.connection.query<Row>(sql, parameters, { ...this.queryMeta, ...meta }, config)
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
