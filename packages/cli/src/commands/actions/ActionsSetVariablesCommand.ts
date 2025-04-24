import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { RemoteProjectResolver } from '../../lib/project/RemoteProjectResolver'
import { ActionsClient } from '../../lib/actions/ActionsClient'

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

	protected async execute(input: Input<Args, Options>): Promise<void | number> {
		const dsn = input.getOption('project')
		const project = await this.remoteProjectResolver.resolve(dsn)
		if (!project) {
			throw `Project not defined`
		}
		const api = ActionsClient.create(project.endpoint, project.name, project.token)
		const mode = input.getOption('merge')
			? 'MERGE' as const : input.getOption('set')
				? 'SET' as const : input.getOption('append-only-missing')
					? 'APPEND_ONLY_MISSING' as const : 'MERGE' as const

		const variables = input.getArgument('variables').flatMap(it => it.split('\n')).filter(it => it.trim().length > 0)
		const result = await api.setVariables(variables.map(it => {
			const [name, value] = it.split('=')
			return { name, value }
		}), mode)
		if (result) {
			console.log('Success')
		} else {
			console.error('Failed')
			return 1
		}
	}
}
