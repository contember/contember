import { Command, CommandConfiguration } from '../../cli'
import { getContemberVersion } from '../../utils/contember'

export class VersionCommand extends Command<{}, {}> {
	protected configure(configuration: CommandConfiguration<{}, {}>): void {
		configuration.description('Prints Contember CLI version')
	}

	protected async execute(): Promise<void | number> {
		console.log(getContemberVersion())
		return 0
	}
}
