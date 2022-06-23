import { Command } from './Command.js'
import { Client, Connection } from '@contember/database'
import { Providers } from '../../utils/index.js'

export class CommandBus<ConnectionType extends Connection.ConnectionLike = Connection.ConnectionLike> {
	constructor(public readonly client: Client<ConnectionType>, private readonly providers: Providers) {}

	public async execute<T>(command: Command<T>): Promise<T> {
		return await command.execute({ db: this.client, providers: this.providers, bus: this })
	}

	async transaction<T>(
		transactionScope: (wrapper: CommandBus<Connection.TransactionLike>) => Promise<T> | T,
	): Promise<T> {
		return await this.client.transaction(client =>
			transactionScope(new CommandBus<Connection.TransactionLike>(client, this.providers)),
		)
	}
}
