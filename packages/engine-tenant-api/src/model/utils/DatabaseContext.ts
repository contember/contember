import { Client, Connection } from '@contember/database'
import { Providers } from '../providers'
import { CommandBus } from '../commands'

export class DatabaseContext<Conn extends Connection.ConnectionLike = Connection.ConnectionLike> {
	constructor(
		public readonly client: Client<Conn>,
		public readonly providers: Providers,
	) {
	}

	public get commandBus() {
		return new CommandBus(this.client, this.providers)
	}

	public get queryHandler() {
		return this.client.createQueryHandler()
	}

	public async transaction<T>(cb: (dbContext: DatabaseContext<Connection.TransactionLike>) => Promise<T>): Promise<T> {
		return await this.client.transaction(async db => {
			await db.query(Connection.REPEATABLE_READ)
			return await cb(new DatabaseContext(db, this.providers))
		})
	}
}

export class DatabaseContextFactory {
	constructor(
		private readonly connection: Connection.ClientFactory,
		private readonly providers: Providers,
	) {
	}

	public create(): DatabaseContext {
		return new DatabaseContext(this.connection.createClient('tenant', { module: 'tenant' }), this.providers)
	}
}
