import { Client } from '@contember/database'
import { CommandBus } from './CommandBus'
import { Providers } from '../../utils'

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
export { type Command }
