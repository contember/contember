import { Command } from './Command'
import { Client } from '@contember/database'
import { Providers } from '../providers'

export class CommandBus {
	constructor(private readonly client: Client, private readonly providers: Providers) {}

	public async execute<T>(command: Command<T>): Promise<T> {
		return await command.execute({ db: this.client, providers: this.providers, bus: this })
	}

	async transaction<T>(transactionScope: (wrapper: CommandBus) => Promise<T> | T): Promise<T> {
		return await this.client.transaction(client => transactionScope(new CommandBus(client, this.providers)))
	}
}
