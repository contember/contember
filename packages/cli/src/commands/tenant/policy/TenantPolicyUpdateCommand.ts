import { Command, CommandConfiguration, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { AUTH_POLICY_JSON_EXAMPLE, parseAuthPolicyInput, readTextInput } from './policyInput.js'
import { readStdinText, StdinReader } from '../../../lib/tenant/stdin.js'
import { humanText } from '../tenantOutput.js'

type Args = {
	id: string
}

type Options = {
	policy?: string
	['policy-stdin']?: boolean
}

export class TenantPolicyUpdateCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
		private readonly readStdin: StdinReader = readStdinText,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Replace an auth policy with the given AuthPolicyInput JSON document.')
		configuration.argument('id').description('Id of the auth policy, as printed by "tenant policy list".')
		configuration.option('policy').valueRequired().description(`The policy as JSON, e.g. '${AUTH_POLICY_JSON_EXAMPLE}'.`)
		configuration.option('policy-stdin').valueNone().description('Read the policy JSON from stdin instead of --policy.')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const id = input.getArgument('id')
		// the mutation replaces the whole row, so the JSON must carry every field the policy should keep
		const policy = parseAuthPolicyInput(
			await readTextInput({
				label: 'policy',
				inline: input.getOption('policy'),
				inlineFlag: '--policy',
				fromStdin: input.getOption('policy-stdin') === true,
				stdinFlag: '--policy-stdin',
			}, this.readStdin),
		)

		await this.tenantClientProvider.policy().updateAuthPolicy(id, policy)

		output.data({ id, scope: policy.scope, project: policy.project ?? null }, {
			human: result => `Updated auth policy ${humanText(result.id)}.`,
			quiet: result => result.id,
		})
	}
}
