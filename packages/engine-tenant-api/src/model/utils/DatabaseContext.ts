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
		private readonly db: Client,
		private readonly providers: Providers,
	) {
	}

	public create(projectGroupSlug: string | undefined): DatabaseContext {
		let schema = 'tenant'
		if (projectGroupSlug !== undefined) {
			const normalizedSlug = projectGroupSlug.replace(/\W/g, '').slice(0, 15)
			const hash = this.providers.hash(projectGroupSlug, 'md5').toString('hex')
			schema = `tenant_${normalizedSlug}_${hash}`
		}
		return new DatabaseContext(this.db.forSchema(schema), this.providers)
	}
}
