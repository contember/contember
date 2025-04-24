import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { RemoteProjectResolver } from '../../lib/project/RemoteProjectResolver'
import { ActionsClient } from '../../lib/actions/ActionsClient'
import chalkTable from 'chalk-table'

type Args = {
}

type Options = {
	project?: string
}

export class ActionsListVariablesCommand extends Command<Args, Options> {
	constructor(
		private readonly remoteProjectResolver: RemoteProjectResolver,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Show action variables')
		configuration.option('project').valueRequired()
	}

	protected async execute(input: Input<Args, Options>): Promise<void | number> {
		const dsn = input.getOption('project')
		const project = await this.remoteProjectResolver.resolve(dsn)
		if (!project) {
			throw `Project not defined`
		}
		const api = ActionsClient.create(project.endpoint, project.name, project.token)
		const result = await api.listVariables()
		console.log(chalkTable({
			columns: ['name', 'value'],
		}, result))
	}
}
