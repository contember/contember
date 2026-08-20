import { Command, CommandConfiguration, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { readStdinText, type StdinReader } from '../../../lib/tenant/stdin.js'
import { environmentInput, literalInput, resolveRequiredTenantInput, stdinInput, type TenantInputSource } from '../../../lib/tenant/input/index.js'
import { humanText } from '../tenantOutput.js'

type Args = {
	slug: string
	key: string
}
type Options = {
	value?: string
	['value-env']?: string
	['value-stdin']?: boolean
}

export class TenantProjectSecretSetCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
		private readonly readStdinFn: StdinReader = readStdinText,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Set a project secret from exactly one explicit input source')
		configuration.argument('slug').description('Project slug')
		configuration.argument('key').description('Secret key')
		configuration.option('value').valueRequired().description(
			'Secret value as a literal argument. The value is visible in shell history and process listings.',
		)
		configuration.option('value-env').valueRequired().description('Read the secret value from the named environment variable without modifying it.')
		configuration.option('value-stdin').valueNone().description('Read the secret value from stdin. Removes exactly one trailing LF or CRLF.')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const slug = input.getArgument('slug')
		const key = input.getArgument('key')
		const sources: TenantInputSource<'secret'>[] = []
		const literalValue = input.getOption('value')
		const environmentVariable = input.getOption('value-env')
		if (literalValue !== undefined) {
			sources.push(literalInput('secret', '--value', literalValue))
		}
		if (environmentVariable !== undefined) {
			sources.push(environmentInput('secret', '--value-env', environmentVariable))
		}
		if (input.getOption('value-stdin') === true) {
			sources.push(stdinInput('secret', '--value-stdin'))
		}

		const source = await resolveRequiredTenantInput(sources, {
			label: 'project secret',
			trailingLineEnding: sources.length === 1 && sources[0]?.kind === 'stdin' ? 'remove-one' : 'preserve',
		}, { readStdin: this.readStdinFn })

		await this.tenantClientProvider.project().setProjectSecret(slug, key, source.value)
		output.data({ slug, key }, {
			human: it => `Secret "${humanText(it.key)}" set on project "${humanText(it.slug)}".`,
			quiet: it => it.key,
		})
	}
}
