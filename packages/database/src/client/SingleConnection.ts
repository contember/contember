import { Client as PgClient } from 'pg'
import { EventManager } from './EventManager'
import { Client } from './Client'
import { Transaction } from './Transaction'
import { executeQuery } from './execution'
import { Connection } from './Connection'

class SingleConnection implements Connection.ConnectionLike, Connection.ClientFactory {
	constructor(
		private readonly pgClient: PgClient,
		private readonly queryConfig: Connection.QueryConfig,
		public readonly eventManager: EventManager = new EventManager(null),
		private isConnected = false,
	) {}

	public createClient(schema: string, queryMeta: Record<string, any>): Client {
		return new Client(this, schema, queryMeta, new EventManager(this.eventManager))
	}

	async transaction<Result>(
		callback: (connection: Connection.TransactionLike) => Promise<Result> | Result,
		options: { eventManager?: EventManager } = {},
	): Promise<Result> {
		if (!this.isConnected) {
			await this.pgClient.connect()
			this.isConnected = true
		}
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
		if (!this.isConnected) {
			await this.pgClient.connect()
			this.isConnected = true
		}
		const query: Connection.Query = { sql, parameters, meta, ...this.queryConfig, ...config }
		try {
			return await executeQuery<Row>(this.pgClient, config.eventManager ?? this.eventManager, query, {})
		} catch (e) {
			throw e
		}
	}
}
export { SingleConnection }
