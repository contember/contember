import { Command, CommandConfiguration } from '@contember/cli-common'

export class VersionCommand extends Command<{}, {}> {
	constructor(
		private readonly version: string,
	) {
		super()
	}
	protected configure(configuration: CommandConfiguration<{}, {}>): void {
		configuration.description('Prints Contember CLI version')
	}

	protected async execute(): Promise<void | number> {
		console.log(this.version)
		return 0
	}
}
