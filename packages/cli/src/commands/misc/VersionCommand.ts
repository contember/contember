import { Command, CommandConfiguration, Input, Output } from '@contember/cli-common'

type Args = {}
type Options = {}

/**
 * The reference implementation of the output contract: the value goes to stdout through `output.data`,
 * which renders it as plain text for a human, as JSON with --json and bare with --quiet.
 */
export class VersionCommand extends Command<Args, Options> {
	constructor(
		private readonly version: string,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Prints Contember CLI version')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		output.data(this.version, it => it)
	}
}
