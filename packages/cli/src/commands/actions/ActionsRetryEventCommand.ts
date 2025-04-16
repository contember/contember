import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { RemoteProjectResolver } from '../../lib/project/RemoteProjectResolver'
import { ActionsClient } from '../../lib/actions/ActionsClient'
import chalkTable from 'chalk-table'
type Args = {
	eventId: string
}

type Options = {
	project?: string
}

export class ActionsRetryEventCommand extends Command<Args, Options> {
	constructor(
		private readonly remoteProjectResolver: RemoteProjectResolver,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Retry given event')
		configuration.argument('eventId')
		configuration.option('project').valueRequired()
	}

	protected async execute(input: Input<Args, Options>): Promise<void | number> {
		const dsn = input.getOption('project')
		const project = await this.remoteProjectResolver.resolve(dsn)
		if (!project) {
			throw `Project not defined`
		}
		const api = ActionsClient.create(project.endpoint, project.name, project.token)

		const result = await api.retryEvent(input.getArgument('eventId'))
		if (result) {
			console.log('Event requeued for processing')
		} else {
			console.log('Failed to requeue event. Check the event status')
			return 1
		}
	}
}
