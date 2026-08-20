import { CliError, Command, CommandConfiguration, Input, Output } from '@contember/cli-common'
import { RemoteProjectResolver } from '../../lib/project/RemoteProjectResolver.js'
import { ActionsClientResolver, resolveActionsClient } from '../../lib/actions/resolveActionsClient.js'
import { SetVariablesMode } from '../../lib/actions/ActionsClient.js'

type Args = {
	variables: string[]
}

type Options = {
	project?: string
	merge?: boolean
	set?: boolean
	['append-only-missing']?: boolean
}

export class ActionsSetVariablesCommand extends Command<Args, Options> {
	constructor(
		private readonly remoteProjectResolver: RemoteProjectResolver,
		private readonly resolveClient: ActionsClientResolver = resolveActionsClient,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Set action variables')
		configuration.option('project').valueRequired()
		configuration.option('merge').valueNone().description('merges with new values (default behaviour)')
		configuration.option('set').valueNone().description('replaces all variables')
		configuration.option('append-only-missing').valueNone().description('appends values if not already exist')
		configuration.argument('variables').variadic().description('variables to set, in the form of name=value')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const mode = resolveMode(input)

		const variables = input.getArgument('variables').flatMap(it => it.split('\n')).filter(it => it.trim().length > 0)
		const parsedVariables = variables.map((assignment, position) => {
			// split on the first `=` only — the value (e.g. a base64 payload) may legitimately contain more
			const separatorIndex = assignment.indexOf('=')
			if (separatorIndex === -1) {
				throw invalidAssignment(position, 'missing separator')
			}
			const name = assignment.slice(0, separatorIndex)
			if (name.length === 0) {
				throw invalidAssignment(position, 'empty name')
			}
			return { name, value: assignment.slice(separatorIndex + 1) }
		})
		const api = await this.resolveClient(this.remoteProjectResolver, input.getOption('project'))
		const result = await api.setVariables(parsedVariables, mode)
		if (!result) {
			throw new CliError('Failed to set variables', { code: 'SET_VARIABLES_FAILED' })
		}
		output.data(
			{ mode, count: parsedVariables.length },
			{
				human: result => `Set ${result.count} variable(s) (${result.mode})`,
				quiet: result => result.count,
			},
		)
	}
}

const resolveMode = (input: Input<Args, Options>): SetVariablesMode => {
	const selected: { flag: string; mode: SetVariablesMode }[] = []
	if (input.getOption('merge')) {
		selected.push({ flag: '--merge', mode: 'MERGE' })
	}
	if (input.getOption('set')) {
		selected.push({ flag: '--set', mode: 'SET' })
	}
	if (input.getOption('append-only-missing')) {
		selected.push({ flag: '--append-only-missing', mode: 'APPEND_ONLY_MISSING' })
	}
	if (selected.length > 1) {
		const flags = selected.map(option => option.flag)
		throw new CliError(`Options ${flags.join(', ')} cannot be combined`, {
			code: 'VARIABLE_MODE_CONFLICT',
			details: { options: flags },
		})
	}
	return selected[0]?.mode ?? 'MERGE'
}

const invalidAssignment = (position: number, reason: string): CliError =>
	new CliError(`Invalid variable assignment at position ${position + 1}: ${reason}`, {
		code: 'INVALID_VARIABLE',
		details: { option: 'variables', position: position + 1, reason },
	})
