import { Connection } from './Connection'
import { EventManager } from './EventManager'
import { wrapIdentifier } from '../utils'
import { Notification } from 'pg'

export class Transaction implements Connection.TransactionLike {
	public get isClosed(): boolean {
		return this.state.isClosed
	}

	constructor(
		private readonly connection: Connection.AcquiredConnectionLike,
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
	): Promise<Connection.Result<Row>> {
		if (this.isClosed) {
			throw new Error('Transaction is already closed')
		}
		return await this.connection.scope(async connection => {
			return connection.query(sql, parameters, meta)
		}, { eventManager: this.eventManager })
	}

	async rollback(): Promise<void> {
		await this.close('ROLLBACK')
	}

	async commit(): Promise<void> {
		await this.close('COMMIT')
	}

	private async close(command: string) {
		await this.query(command)
		this.state.close()
	}

	on = this.connection.on.bind(this.connection)

}

class SavePoint implements Connection.TransactionLike {

	constructor(
		public readonly savepointName: string,
		public readonly savepointManager: SavepointState,
		private readonly connection: Connection.AcquiredConnectionLike,
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
	): Promise<Connection.Result<Row>> {
		if (this.isClosed) {
			throw new Error(`Savepoint ${this.savepointName} is already closed.`)
		}
		return await this.connection.scope(connection => {
			return connection.query(sql, parameters, meta)
		}, { eventManager: this.eventManager })
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

	on = this.connection.on.bind(this.connection)
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
		connection: Connection.AcquiredConnectionLike,
		callback: (connection: Connection.TransactionLike) => Promise<Result> | Result,
	) {
		const savepointName = `savepoint_${this.counter++}`

		await connection.query(`SAVEPOINT ${wrapIdentifier(savepointName)}`)
		const savepoint = new SavePoint(savepointName, this, connection)
		return await executeTransaction(savepoint, callback)
	}
}

export const executeTransaction =  async <Result>(
	transaction: Connection.TransactionLike,
	callback: (connection: Connection.TransactionLike) => Promise<Result> | Result,
)  => {
	try {
		const result = await callback(transaction)
		if (!transaction.isClosed) {
			await transaction.commit()
		}
		return result
	} catch (e) {
		if (!transaction.isClosed) {
			await transaction.rollback()
		}
		throw e
	}
}
