import { Command, CommandConfiguration } from '@contember/cli-common'
import { getCliVersion } from '../../utils/contember'

export class VersionCommand extends Command<{}, {}> {
	protected configure(configuration: CommandConfiguration<{}, {}>): void {
		configuration.description('Prints Contember CLI version')
	}

	protected async execute(): Promise<void | number> {
		console.log(getCliVersion())
		return 0
	}
}
