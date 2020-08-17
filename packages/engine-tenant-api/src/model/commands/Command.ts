import { Client } from '@contember/database'
import { Providers } from '../providers'
import { CommandBus } from './CommandBus'

interface Command<Result> {
	execute(args: Command.Args): Promise<Result>
}

namespace Command {
	export interface Args {
		db: Client
		providers: Providers
		bus: CommandBus
	}
}
export { Command }
