import { Client, Connection, retryTransaction } from '@contember/database'
import { Logger } from '@contember/logger'
import { Providers } from '../providers.js'
import { CommandBus } from '../commands/index.js'
import { BatchLoaderArgs, initBatchLoader, ItemLoader } from '../../utils/batchQuery.js'

export interface TransactionOptions {
	/**
	 * Repeat the transaction when postgres aborts it with a serialization failure (40001) — the standing cost of the
	 * repeatable-read level every transaction here runs at.
	 *
	 * Opt in only when the callback has no effect outside the transaction: several managers send a mail from inside
	 * one (InviteManager, EmailChangeManager, PasswordlessSignInManager) and a retry would send it twice.
	 */
	retry?: { logger: Logger }
}

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

	public async transaction<T>(
		cb: (dbContext: DatabaseContext<Connection.TransactionLike>) => Promise<T>,
		options: TransactionOptions = {},
	): Promise<T> {
		const run = async () =>
			await this.client.transaction(async db => {
				await db.query(Connection.REPEATABLE_READ)
				return await cb(new DatabaseContext(db, this.providers))
			})
		const retry = options.retry
		if (!retry) {
			return await run()
		}
		return await retryTransaction(run, message => retry.logger.warn(message))
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
