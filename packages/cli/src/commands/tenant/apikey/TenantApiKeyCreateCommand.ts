import { CliError, Command, CommandConfiguration, ExitCode, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { TenantApiKeyWithToken } from '../../../lib/tenant/clients/TenantApiKeyClient.js'
import { readStdinText, StdinReader } from '../../../lib/tenant/stdin.js'
import { configureMembershipOptions, MembershipOptions, readMembershipInputSource, resolveMemberships } from '../member/membershipInput.js'
import { assertGeneratedTenantToken, assertTenantCredentialContract, humanText } from '../tenantOutput.js'

type Args = {}

type Options = MembershipOptions & {
	project?: string
	global?: true
	description: string
	['token-hash']?: string
	['trust-forwarded-client-info']?: true
}

/** `tenant api-key create` — a project-scoped key (`--project`) or a global one (`--global`); exactly one is required. */
export class TenantApiKeyCreateCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
		private readonly readStdin: StdinReader = readStdinText,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Create a permanent API key, scoped to a project or global. Prints the token — it is shown exactly once.')
		configuration //
			.option('project')
			.valueRequired()
			.description('Create a key as a member of this project (slug). Mutually exclusive with --global.')
		configuration //
			.option('global')
			.valueNone()
			.description('Create a key tied to no project, carrying global tenant roles. Mutually exclusive with --project.')
		configuration //
			.option('description')
			.valueRequired()
			.required()
			.description('Human-readable label for the key.')
		configureMembershipOptions(configuration, {
			roleDescription: 'A role to grant, repeatable. With --project a membership role without variables, with --global a tenant role.',
		})
		configuration //
			.option('token-hash')
			.valueRequired()
			.description('Provision the key from a caller-supplied hex-encoded sha256 token hash instead of generating a token.')
		configuration //
			.option('trust-forwarded-client-info')
			.valueNone()
			.description(
				'Trust X-Contember-Client-IP and X-Contember-Client-User-Agent on requests made with this key. Enable only behind a trusted proxy that strips client-supplied values and sets the real ones; otherwise clients can spoof audit metadata.',
			)
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const project = input.getOption('project')
		const global = input.getOption('global') === true
		const description = input.getOption('description')
		const membershipSource = readMembershipInputSource(input)
		const tokenHash = input.getOption('token-hash')
		const trustForwardedClientInfo = input.getOption('trust-forwarded-client-info') === true

		if (project !== undefined && global) {
			throw new CliError('Options --project and --global are mutually exclusive.', { code: 'CONFLICTING_TARGET', exitCode: ExitCode.InputError })
		}
		if (project === undefined && !global) {
			throw new CliError('Specify either --project <slug> or --global.', { code: 'TARGET_REQUIRED', exitCode: ExitCode.InputError })
		}
		if (global && (membershipSource.json !== undefined || membershipSource.fromStdin)) {
			throw new CliError('--memberships and --memberships-stdin only apply to --project.', {
				code: 'CONFLICTING_OPTION',
				exitCode: ExitCode.InputError,
			})
		}

		const options = trustForwardedClientInfo ? { trustForwardedClientInfo: true } : undefined

		const apiKey = project !== undefined
			? await this.tenantClientProvider.apiKey().createApiKey({
				projectSlug: project,
				memberships: await resolveMemberships(membershipSource, this.readStdin),
				description,
				tokenHash,
				options,
			})
			: await this.tenantClientProvider.apiKey().createGlobalApiKey({ description, roles: membershipSource.roles, tokenHash, options })
		assertTenantCredentialContract((apiKey.token !== null) === (tokenHash === undefined), 'API key')
		const generatedToken = apiKey.token === null ? null : assertGeneratedTenantToken(apiKey.token, 'API key')

		if (apiKey.token !== null) {
			output.warn('This token is shown exactly once and cannot be retrieved again — store it now.')
		} else {
			output.info('No token was returned: the key was provisioned from --token-hash, so the server never held the plaintext.')
		}
		output.data<TenantApiKeyWithToken>(apiKey, {
			human: it => `Created API key ${humanText(it.id)}` + (generatedToken !== null ? `\nToken: ${generatedToken}` : ''),
			quiet: it => generatedToken ?? it.id,
		})
	}
}
