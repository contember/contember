import { Command, CommandConfiguration, escapeTerminalText, Input, JsonValue, Output } from '@contember/cli-common'
import { RemoteProjectResolver } from '../../lib/project/RemoteProjectResolver.js'
import { ActionsClientResolver, resolveActionsClient } from '../../lib/actions/resolveActionsClient.js'
import { Event } from '../../lib/actions/ActionsClient.js'

type Args = {}

type Options = {
	project?: string
}

export class ActionsListFailedEventsCommand extends Command<Args, Options> {
	constructor(
		private readonly remoteProjectResolver: RemoteProjectResolver,
		private readonly resolveClient: ActionsClientResolver = resolveActionsClient,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Show failed events')
		configuration.option('project').valueRequired()
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const api = await this.resolveClient(this.remoteProjectResolver, input.getOption('project'))
		const result = await api.listFailedEvents()
		if (result.length === 0) {
			output.info('No failed events')
		}
		output.table<Event>(
			[
				{ field: 'id', name: 'ID' },
				{ field: 'createdAt', name: 'Created at' },
				{ field: 'lastStateChange', name: 'Last state change' },
				{ field: 'visibleAt', name: 'Visible at' },
				{ field: 'numRetries', name: 'Retries' },
				{ field: 'state', name: 'State' },
				{ field: 'target', name: 'Target' },
				// human mode only: show just the last log entry, a terminal-width row of the full history is unreadable
				{ field: 'log', name: 'Log', format: value => escapeTerminalText(JSON.stringify(lastLogEntry(value)) ?? '') },
			],
			result,
			'id',
		)
	}
}

const lastLogEntry = (log: JsonValue): JsonValue => Array.isArray(log) ? log[log.length - 1] ?? {} : log
