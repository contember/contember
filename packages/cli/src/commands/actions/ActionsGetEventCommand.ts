import { Command, CommandConfiguration, escapeTerminalText, ExitCode, Input, Output } from '@contember/cli-common'
import { RemoteProjectResolver } from '../../lib/project/RemoteProjectResolver.js'
import { ActionsClientResolver, resolveActionsClient } from '../../lib/actions/resolveActionsClient.js'
import { Event } from '../../lib/actions/ActionsClient.js'

type Args = {
	eventIds: string[]
}

type Options = {
	project?: string
}

export class ActionsGetEventCommand extends Command<Args, Options> {
	constructor(
		private readonly remoteProjectResolver: RemoteProjectResolver,
		private readonly resolveClient: ActionsClientResolver = resolveActionsClient,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Get one or more events by id')
		configuration.argument('eventIds').variadic().description('event ids to fetch')
		configuration.option('project').valueRequired()
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void | number> {
		const api = await this.resolveClient(this.remoteProjectResolver, input.getOption('project'))
		const ids = input.getArgument('eventIds')

		// looped rather than parallel: ActionsClient only exposes a single-id getEvent call
		const results: { id: string; event: Event | null }[] = []
		for (const id of ids) {
			results.push({ id, event: await api.getEvent(id) })
		}
		const missingIds = results.filter(it => it.event === null).map(it => it.id)
		if (missingIds.length > 0) {
			output.warn(`Event not found: ${missingIds.join(', ')}`)
		}

		if (results.length === 1) {
			const [{ id, event }] = results
			output.data(event, {
				human: value => value === null ? `Event ${escapeTerminalText(id)} not found` : sanitizeMultiline(JSON.stringify(value, null, 2)),
				quiet: () => id,
			})
		} else {
			output.data(results, {
				human: value =>
					value.map(item =>
						item.event === null
							? `${escapeTerminalText(item.id)}: not found`
							: sanitizeMultiline(JSON.stringify(item.event, null, 2))
					).join('\n\n'),
				quiet: value => value.map(item => item.id),
			})
		}
		return missingIds.length > 0 ? ExitCode.NotFound : ExitCode.Success
	}
}

const sanitizeMultiline = (value: string): string => value.split('\n').map(escapeTerminalText).join('\n')
