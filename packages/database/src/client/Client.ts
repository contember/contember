import { DeleteBuilder, InsertBuilder, SelectBuilder, UpdateBuilder } from '../builders'
import { DatabaseQueryable } from '../queryable'
import { Connection } from './Connection'
import { EventManager } from './EventManager'
import { QueryHandler } from '@contember/queryable'
import { withDatabaseAdvisoryLock, wrapIdentifier } from '../utils'

class Client<ConnectionType extends Connection.ConnectionLike = Connection.ConnectionLike> implements Connection.Queryable {
	constructor(
		public readonly connection: ConnectionType,
		public readonly schema: string,
		public readonly queryMeta: Record<string, any>,
		public readonly eventManager: EventManager = new EventManager(connection.eventManager),
	) {
	}

	public forSchema(schema: string): Client<ConnectionType> {
		const eventManager = new EventManager(this.eventManager.parent)
		return new Client<ConnectionType>(this.connection, schema, this.queryMeta, eventManager)
	}

	async scope<T>(callback: (wrapper: Client<ConnectionType & Connection.AcquiredConnectionLike>) => Promise<T> | T): Promise<T> {
		return await this.connection.scope(
			connection => callback(
				new Client(
					connection as ConnectionType & Connection.AcquiredConnectionLike,
					this.schema,
					this.queryMeta,
					new EventManager(connection.eventManager),
				),
			),
			{ eventManager: this.eventManager },
		)
	}

	async transaction<T>(transactionScope: (wrapper: Client<Connection.TransactionLike>) => Promise<T> | T): Promise<T> {
		return await this.connection.transaction(
			transaction => transactionScope(
				new Client<Connection.TransactionLike>(
					transaction,
					this.schema,
					this.queryMeta,
					new EventManager(transaction.eventManager),
				),
			),
			{ eventManager: this.eventManager },
		)
	}

	async locked<T>(lock: number, callback: (wrapper: Client<Connection.ConnectionLike>) => Promise<T> | T): Promise<T> {
		return await this.scope(client =>
			withDatabaseAdvisoryLock(client.connection, lock, () => callback(client)),
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
		parameters: readonly any[] = [],
		meta: Record<string, any> = {},
	): Promise<Connection.Result<Row>> {
		return this.connection.scope(
			connection => connection.query(sql, parameters, { ...this.queryMeta, ...meta }),
			{ eventManager: this.eventManager },
		)
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
