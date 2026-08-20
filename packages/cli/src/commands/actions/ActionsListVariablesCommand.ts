import { Command, CommandConfiguration, Input, Output } from '@contember/cli-common'
import { RemoteProjectResolver } from '../../lib/project/RemoteProjectResolver.js'
import { ActionsClientResolver, resolveActionsClient } from '../../lib/actions/resolveActionsClient.js'

type Args = {}

type Options = {
	project?: string
}

export class ActionsListVariablesCommand extends Command<Args, Options> {
	constructor(
		private readonly remoteProjectResolver: RemoteProjectResolver,
		private readonly resolveClient: ActionsClientResolver = resolveActionsClient,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Show action variables')
		configuration.option('project').valueRequired()
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const api = await this.resolveClient(this.remoteProjectResolver, input.getOption('project'))
		const result = await api.listVariables()
		output.table(
			[
				{ field: 'name', name: 'Name' },
				{ field: 'value', name: 'Value' },
			],
			result,
			'name',
		)
	}
}
