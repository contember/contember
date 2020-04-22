import { Client } from '@contember/database'
import { CommandBus } from './CommandBus'
import { Providers } from '../../utils'

interface Command<Result> {
	execute(args: { db: Client; providers: Providers; bus: CommandBus }): Promise<Result>
}

namespace Command {
	export interface Args {
		db: Client
		providers: Providers
		bus: CommandBus
	}
}
export { Command }
