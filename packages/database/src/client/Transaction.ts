import { Connection } from './Connection'
import { EventManager } from './EventManager'
import { wrapIdentifier } from '../utils'

export class Transaction implements Connection.TransactionLike {
	public get isClosed(): boolean {
		return this.state.isClosed
	}

	constructor(
		private readonly connection: Connection.ConnectionLike,
		private readonly savepointManager = new SavepointState(),
		private readonly state = new TransactionLikeState(),
	) {
	}

	get eventManager() {
		return this.connection.eventManager
	}

	async scope<Result>(
		callback: (connection: Connection.TransactionLike) => Promise<Result> | Result,
		{ eventManager = this.eventManager }: { eventManager?: EventManager } = {},
	): Promise<Result> {
		return await this.connection.scope(async connection => {
			return await callback(new Transaction(connection, this.savepointManager, this.state))
		}, { eventManager })
	}

	async transaction<Result>(
		callback: (connection: Connection.TransactionLike) => Promise<Result> | Result,
		options?: { eventManager?: EventManager },
	): Promise<Result> {
		return await this.scope(async connection => {
			return await this.savepointManager.execute(connection, callback)
		}, options)
	}

	async query<Row extends Record<string, any>>(
		sql: string,
		parameters: any[] = [],
		meta: Record<string, any> = {},
		{ eventManager = this.eventManager, ...config }: Connection.QueryConfig = {},
	): Promise<Connection.Result<Row>> {
		if (this.isClosed) {
			throw new Error('Transaction is already closed')
		}
		return await this.connection.scope(async connection => {
			return connection.query(sql, parameters, meta, config)
		}, { eventManager })
	}

	async rollback(): Promise<void> {
		await this.close('ROLLBACK')
	}

	async rollbackUnclosed(): Promise<void> {
		if (this.isClosed) {
			return
		}
		await this.rollback()
	}

	async commit(): Promise<void> {
		await this.close('COMMIT')
	}

	async commitUnclosed(): Promise<void> {
		if (this.isClosed) {
			return
		}
		await this.commit()
	}

	private async close(command: string) {
		await this.query(command)
		this.state.close()
	}
}

class SavePoint implements Connection.TransactionLike {

	constructor(
		public readonly savepointName: string,
		public readonly savepointManager: SavepointState,
		private readonly connection: Connection.ConnectionLike,
		private readonly state = new TransactionLikeState(),
	) {
	}

	get isClosed() {
		return this.state.isClosed
	}

	get eventManager() {
		return this.connection.eventManager
	}

	async scope<Result>(
		callback: (connection: Connection.TransactionLike) => Promise<Result> | Result,
		{ eventManager = this.eventManager }: { eventManager?: EventManager } = {},
	): Promise<Result> {
		return this.connection.scope(async connection => {
			return await callback(new SavePoint(this.savepointName, this.savepointManager, connection, this.state))
		}, { eventManager })
	}


	async transaction<Result>(
		callback: (connection: Connection.TransactionLike) => Promise<Result> | Result,
		options: { eventManager?: EventManager } = {},
	): Promise<Result> {
		return await this.scope(async connection => {
			return await this.savepointManager.execute(connection, callback)
		}, options)
	}

	async query<Row extends Record<string, any>>(
		sql: string,
		parameters: any[] = [],
		meta: Record<string, any> = {},
		{ eventManager = this.eventManager, ...config }: Connection.QueryConfig = {},
	): Promise<Connection.Result<Row>> {
		if (this.isClosed) {
			throw new Error(`Savepoint ${this.savepointName} is already closed.`)
		}
		return await this.connection.scope(connection => {
			return connection.query(sql, parameters, meta, config)
		}, { eventManager })
	}

	async rollback(): Promise<void> {
		await this.close(`ROLLBACK TO SAVEPOINT ${wrapIdentifier(this.savepointName)}`)
	}

	async commit(): Promise<void> {
		await this.close(`RELEASE SAVEPOINT ${wrapIdentifier(this.savepointName)}`)
	}

	private async close(sql: string) {
		await this.query(sql)
		this.state.close()
	}
}

class TransactionLikeState {
	private _isClosed = false

	public get isClosed(): boolean {
		return this._isClosed
	}

	public close(): void {
		this._isClosed = true
	}
}

class SavepointState {
	public counter = 1

	public async execute<Result>(
		connection: Connection.ConnectionLike,
		callback: (connection: Connection.TransactionLike) => Promise<Result> | Result,
	) {
		const savepointName = `savepoint_${this.counter++}`

		await connection.query(`SAVEPOINT ${wrapIdentifier(savepointName)}`)
		const savepoint = new SavePoint(
			savepointName,
			this,
			connection,
		)
		try {
			const result = await callback(savepoint)
			if (!savepoint.isClosed) {
				await savepoint.commit()
			}
			return result
		} catch (e) {
			if (!savepoint.isClosed) {
				await savepoint.rollback()
			}
			throw e
		}
	}
}
