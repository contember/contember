import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { RemoteProjectResolver } from '../../lib/project/RemoteProjectResolver'
import { ActionsClient } from '../../lib/actions/ActionsClient'

type Args = {
	eventId: string
}

type Options = {
	project?: string
}

export class ActionsGetEventCommand extends Command<Args, Options> {
	constructor(
		private readonly remoteProjectResolver: RemoteProjectResolver,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Get single event')
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

		const result = await api.getEvent(input.getArgument('eventId'))
		if (!result) {
			console.log('Event not found')
			return 1
		}
		console.log(JSON.stringify(result, null, 2))

	}
}
