import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { RemoteProjectResolver } from '../../lib/project/RemoteProjectResolver'
import { ActionsClient } from '../../lib/actions/ActionsClient'
import chalkTable from 'chalk-table'
type Args = {
}

type Options = {
	project?: string
	json?: boolean
}

export class ActionsListFailedEventsCommand extends Command<Args, Options> {
	constructor(
		private readonly remoteProjectResolver: RemoteProjectResolver,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Show failed events')
		configuration.option('project').valueRequired()
		configuration.option('json').valueNone()
	}

	protected async execute(input: Input<Args, Options>): Promise<void | number> {
		const dsn = input.getOption('project')
		const project = await this.remoteProjectResolver.resolve(dsn)
		if (!project) {
			throw `Project not defined`
		}
		const api = ActionsClient.create(project.endpoint, project.name, project.token)

		const result = await api.listFailedEvents()
		if (input.getOption('json')) {
			console.log(JSON.stringify(result, null, 2))
			return
		}
		if (result.length === 0) {
			console.log('No failed events')
			return
		}
		const table = chalkTable(
			{
				columns: [
					{ field: 'id', name: 'ID' },
					{ field: 'createdAt', name: 'Created at' },
					{ field: 'lastStateChange', name: 'Last state change' },
					{ field: 'visibleAt', name: 'Visible at' },
					{ field: 'numRetries', name: 'Retries' },
					{ field: 'state', name: 'State' },
					{ field: 'target', name: 'Target' },
					{ field: 'log', name: 'Log' },
				],
			},
			result.map(it => ({
				id: it.id,
				createdAt: it.createdAt,
				lastStateChange: it.lastStateChange,
				visibleAt: it.visibleAt || '',
				numRetries: it.numRetries.toString(),
				state: it.state,
				target: it.target,
				log: JSON.stringify(it.log.length > 0 ? it.log[it.log.length - 1] : {}),
			})),
		)
		console.log(table)

	}
}
