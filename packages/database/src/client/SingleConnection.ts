import pg from 'pg'
import { EventManager } from './EventManager.js'
import { Client } from './Client.js'
import { Transaction } from './Transaction.js'
import { executeQuery } from './execution.js'
import { Connection } from './Connection.js'
import { DatabaseConfig } from '../types.js'
import { ClientError } from './errors.js'
import { createPgClientFactory } from '../utils/index.js'

export class SingleConnection implements Connection.ConnectionLike, Connection.ClientFactory {
	private readonly pgClient: pg.Client
	private isConnected = false

	constructor(
		private readonly config: pg.ClientConfig & DatabaseConfig,
		private readonly queryConfig: Connection.QueryConfig,
		public readonly eventManager: EventManager = new EventManager(null),
	) {
		this.pgClient = createPgClientFactory(config)()
		this.pgClient.on('error', err => {
			// eslint-disable-next-line no-console
			console.error(err)
			this.eventManager.fire(EventManager.Event.clientError, err)
		})
	}

	public createClient(schema: string, queryMeta: Record<string, any>): Client {
		return new Client(this, schema, queryMeta, new EventManager(this.eventManager))
	}

	async transaction<Result>(
		callback: (connection: Connection.TransactionLike) => Promise<Result> | Result,
		options: { eventManager?: EventManager } = {},
	): Promise<Result> {
		await this.maybeConnect()
		const eventManager = new EventManager(options.eventManager ?? this.eventManager)
		await executeQuery(
			this.pgClient,
			eventManager,
			{
				sql: 'BEGIN',
				...this.queryConfig,
			},
		)
		const transaction = new Transaction(this.pgClient, eventManager, this.queryConfig)
		try {
			const result = await callback(transaction)

			await transaction.commitUnclosed()

			return result
		} catch (e) {
			await transaction.rollbackUnclosed()
			throw e
		}
	}

	async end(): Promise<void> {
		this.isConnected = false
		await this.pgClient.end()
	}

	async query<Row extends Record<string, any>>(
		sql: string,
		parameters: any[] = [],
		meta: Record<string, any> = {},
		config: Connection.QueryConfig = {},
	): Promise<Connection.Result<Row>> {
		await this.maybeConnect()
		const query: Connection.Query = { sql, parameters, meta, ...this.queryConfig, ...config }
		try {
			return await executeQuery<Row>(this.pgClient, config.eventManager ?? this.eventManager, query, {})
		} catch (e) {
			throw e
		}
	}

	private async maybeConnect() {
		if (!this.isConnected) {
			try {
				await this.pgClient.connect()
			} catch (e) {
				throw new ClientError(e)
			}
			this.isConnected = true
		}
	}
}
