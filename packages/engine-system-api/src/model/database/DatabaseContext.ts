import { Client, Connection, DatabaseQueryable } from '@contember/database'
import { QueryHandler } from '@contember/queryable'
import { UuidProvider } from '../../utils'
import { CommandBus } from '../commands'

export interface DatabaseContext<ConnectionType extends Connection.ConnectionLike = Connection.ConnectionLike> {
	client: Client<ConnectionType>
	queryHandler: QueryHandler<DatabaseQueryable>
	transaction: <T>(cb: (db: DatabaseContext<Connection.TransactionLike>) => Promise<T> | T) => Promise<T>
	locked: <T>(lock: number, cb: (db: DatabaseContext<Connection.ConnectionLike>) => Promise<T> | T) => Promise<T>
	commandBus: CommandBus
}

export class DatabaseContextFactory {
	constructor(
		public readonly schemaName: string,
		private readonly connection: Connection,
		private readonly providers: UuidProvider,
	) {}

	public create(connection?: Connection.ConnectionLike): DatabaseContext {
		const client = new Client(connection ?? this.connection, this.schemaName, { module: 'system' })
		return createDatabaseContext(client, this.providers)
	}
}

const createDatabaseContext = <ConnectionType extends Connection.ConnectionLike = Connection.ConnectionLike>(
	client: Client<ConnectionType>,
	providers: UuidProvider,
): DatabaseContext<ConnectionType> => ({
	client,
	queryHandler: client.createQueryHandler(),
	transaction: cb =>
		client.transaction(async client => {
			await client.query(Connection.REPEATABLE_READ)
			return cb(createDatabaseContext(client, providers))
		}),
	commandBus: new CommandBus(client, providers),
	locked: (lock, cb) => client.locked(lock, client => cb(createDatabaseContext(client, providers))),
})
