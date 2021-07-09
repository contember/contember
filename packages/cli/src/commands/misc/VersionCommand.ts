import { Command, CommandConfiguration, getPackageVersion } from '@contember/cli-common'

export class VersionCommand extends Command<{}, {}> {
	protected configure(configuration: CommandConfiguration<{}, {}>): void {
		configuration.description('Prints Contember CLI version')
	}

	protected async execute(): Promise<void | number> {
		console.log(getPackageVersion())
		return 0
	}
}
