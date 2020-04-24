import { Client, Connection, DatabaseQueryable } from '@contember/database'
import { QueryHandler } from '@contember/queryable'
import { UuidProvider } from '../../utils'
import { CommandBus } from '../commands'
import { setupSystemVariables } from '../helpers'

export interface DatabaseContext<ConnectionType extends Connection.ConnectionLike = Connection.ConnectionLike> {
	client: Client<ConnectionType>
	queryHandler: QueryHandler<DatabaseQueryable>
	transaction: <T>(cb: (db: DatabaseContext<Connection.TransactionLike>) => Promise<T> | T) => Promise<T>
	commandBus: CommandBus
}

export class DatabaseContextFactory {
	constructor(private readonly client: Client, private readonly providers: UuidProvider) {}

	public create(identityId: string | undefined): DatabaseContext {
		return createDatabaseContext(this.client, identityId, this.providers)
	}
}

const createDatabaseContext = <ConnectionType extends Connection.ConnectionLike = Connection.ConnectionLike>(
	client: Client<ConnectionType>,
	identityId: string | undefined,
	providers: UuidProvider,
): DatabaseContext<ConnectionType> => ({
	client,
	queryHandler: client.createQueryHandler(),
	transaction: cb =>
		client.transaction(async client => {
			await client.query(Connection.REPEATABLE_READ)
			if (identityId) {
				await setupSystemVariables(client, identityId, providers)
			}
			return cb(createDatabaseContext(client, undefined, providers))
		}),
	commandBus: new CommandBus(client, providers),
})
