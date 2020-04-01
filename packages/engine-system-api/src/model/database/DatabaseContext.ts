import { Client, Connection, DatabaseQueryable } from '@contember/database'
import { QueryHandler } from '@contember/queryable'
import { setupSystemVariables } from '../../SystemVariablesSetupHelper'
import { UuidProvider } from '../../utils/uuid'
import { CommandBus } from '../commands/CommandBus'

export interface DatabaseContext {
	client: Client
	queryHandler: QueryHandler<DatabaseQueryable>
	transaction: <T>(cb: (db: DatabaseContext) => Promise<T> | T) => Promise<T>
	commandBus: CommandBus
}

export class DatabaseContextFactory {
	constructor(private readonly client: Client, private readonly providers: UuidProvider) {}

	public create(identityId: string | undefined): DatabaseContext {
		return createDatabaseContext(this.client, identityId, this.providers)
	}
}

const createDatabaseContext = (
	client: Client,
	identityId: string | undefined,
	providers: UuidProvider,
): DatabaseContext => ({
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
