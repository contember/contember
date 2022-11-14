import { Client, Connection } from '@contember/database'
import { Providers } from '../providers'
import { CommandBus } from '../commands'
import { BatchLoaderArgs, initBatchLoader, ItemLoader } from '../../utils/batchQuery'

export class DatabaseContext<Conn extends Connection.ConnectionLike = Connection.ConnectionLike> {
	private loaders = new Map<BatchLoaderArgs<any, any, any>, ItemLoader<any, any>>()

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

	public async scope<T>(cb: (dbContext: DatabaseContext<Connection.AcquiredConnectionLike>) => Promise<T>): Promise<T> {
		return await this.client.scope(async db => {
			return await cb(new DatabaseContext(db, this.providers))
		})
	}

	public batchLoad<Arg, Result, Item>(loaderArgs: BatchLoaderArgs<Arg, Result, Item>, arg: Arg): Promise<Item> {
		const existing = this.loaders.get(loaderArgs)
		if (existing) {
			return existing(arg)
		}
		const newLoader = initBatchLoader(loaderArgs, this)
		this.loaders.set(loaderArgs, newLoader)
		return newLoader(arg)
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
