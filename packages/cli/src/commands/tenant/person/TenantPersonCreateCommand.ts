import { CliError, Command, CommandConfiguration, ExitCode, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { TenantPerson } from '../../../lib/tenant/clients/TenantPersonClient.js'
import { assertBcryptHash, type CaptchaTokenOptions, configureCaptchaTokenOptions, resolveCaptchaToken, resolveSecret } from './personInput.js'
import { humanText, requireNonEmptyTenantName } from '../tenantOutput.js'
import { readStdinText, StdinReader } from '../../../lib/tenant/stdin.js'

type Args = {
	email: string
}

type Options = CaptchaTokenOptions & {
	name?: string
	role?: string[]
	['password-stdin']?: boolean
	['password-env']?: string
	['password-hash-stdin']?: boolean
	['password-hash-env']?: string
}

export class TenantPersonCreateCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
		private readonly readStdin: StdinReader = readStdinText,
		private readonly readEnvironment: (name: string) => string | undefined = name => process.env[name],
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description(
			'Create a person (tenant signUp). Consumes the per-IP sign-up rate limit (config rateLimits.signUpPerIp, disabled by default, '
				+ 'so bulk creation only throttles once a tenant configures it), verifies a captcha when one is configured, and sends a '
				+ 'verification e-mail when signup.requireEmailVerification is on.',
		)
		configuration.argument('email').description('E-mail address of the new person.')
		configuration.option('name').valueRequired().description('Display name of the new person.')
		configuration.option('role').valueArray().description('Global identity role to grant. Repeat the option to grant several.')
		configuration.option('password-stdin').valueNone().description('Read the plaintext password from stdin.')
		configuration.option('password-env').valueRequired().description('Read the plaintext password from the named environment variable.')
		configuration.option('password-hash-stdin').valueNone().description('Read a bcrypt ($2b$) password hash from stdin.')
		configuration.option('password-hash-env').valueRequired().description(
			'Read a bcrypt ($2b$) password hash from the named environment variable. Preferred for provisioning — the plaintext never leaves your side.',
		)
		configureCaptchaTokenOptions(configuration)
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const email = input.getArgument('email')
		const name = requireNonEmptyTenantName(input.getOption('name'), 'Person')
		const passwordFromStdin = input.getOption('password-stdin') === true
		const passwordHashFromStdin = input.getOption('password-hash-stdin') === true
		const captchaFromStdin = input.getOption('captcha-token-stdin') === true
		if (captchaFromStdin && (passwordFromStdin || passwordHashFromStdin)) {
			throw new CliError('Only one value can consume stdin. Combine a --*-stdin option with an environment-backed source instead.', {
				code: 'AMBIGUOUS_STDIN_INPUT',
				exitCode: ExitCode.InputError,
			})
		}
		const secret = await resolveSecret(
			[
				{ name: 'password', stdin: passwordFromStdin, env: input.getOption('password-env') },
				{ name: 'password-hash', stdin: passwordHashFromStdin, env: input.getOption('password-hash-env') },
			],
			this.readStdin,
		)
		const password = secret?.name === 'password' ? secret.value : undefined
		const passwordHash = secret?.name === 'password-hash' ? secret.value : undefined
		if (passwordHash !== undefined) {
			assertBcryptHash(passwordHash)
		}
		if (secret === undefined) {
			output.warn('No password given. The person is created without one and can only sign in after a password reset or through an identity provider.')
		}
		const captchaToken = await resolveCaptchaToken(
			{
				'captcha-token': input.getOption('captcha-token'),
				'captcha-token-env': input.getOption('captcha-token-env'),
				'captcha-token-stdin': input.getOption('captcha-token-stdin'),
			},
			this.readStdin,
			this.readEnvironment,
		)

		output.info(`Creating person ${email}`)
		const person = await this.tenantClientProvider.person().signUp({
			email,
			password,
			passwordHash,
			name,
			roles: input.getOption('role'),
			captchaToken,
		})

		output.info(`Created person ${person.id} with identity ${person.identityId}.`)
		output.data<TenantPerson>(person, { human: it => humanText(it.id), quiet: it => it.id })
	}
}
