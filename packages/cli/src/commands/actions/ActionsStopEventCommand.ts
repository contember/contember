import { Command, CommandConfiguration, escapeTerminalText, ExitCode, Input, Output } from '@contember/cli-common'
import { RemoteProjectResolver } from '../../lib/project/RemoteProjectResolver.js'
import { ActionsClientResolver, resolveActionsClient } from '../../lib/actions/resolveActionsClient.js'
import { ActionMutationResult, runActionMutationBatch, validateActionEventIds } from '../../lib/actions/runActionMutationBatch.js'

type Args = {
	eventIds: string[]
}

type Options = {
	project?: string
}

export class ActionsStopEventCommand extends Command<Args, Options> {
	constructor(
		private readonly remoteProjectResolver: RemoteProjectResolver,
		private readonly resolveClient: ActionsClientResolver = resolveActionsClient,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Stop one or more events')
		configuration.argument('eventIds').variadic().description('event ids to stop')
		configuration.option('project').valueRequired()
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void | number> {
		const ids = input.getArgument('eventIds')
		validateActionEventIds(ids)
		const api = await this.resolveClient(this.remoteProjectResolver, input.getOption('project'))

		const batch = await runActionMutationBatch(ids, id => api.stopEvent(id), {
			code: 'ACTION_STOP_FAILED',
			retryable: false,
			exitCode: ExitCode.NotFound,
		})
		if (batch.results.length === 1) {
			output.data(batch.results[0], {
				human: result => renderResults([result]),
				quiet: result => result.id,
			})
		} else {
			output.data(batch.results, {
				human: renderResults,
				quiet: results => results.map(result => result.id),
			})
		}
		return batch.exitCode
	}
}

const renderResults = (results: readonly ActionMutationResult[]): string =>
	results
		.map(result =>
			result.ok
				? escapeTerminalText(`Event ${result.id} stopped`)
				: escapeTerminalText(`Failed to stop event ${result.id} (${result.error.code})`)
		)
		.join('\n')
