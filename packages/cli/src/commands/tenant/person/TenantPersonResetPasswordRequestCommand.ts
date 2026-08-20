import { Command, CommandConfiguration, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { readStdinText, type StdinReader } from '../../../lib/tenant/stdin.js'
import { type CaptchaTokenOptions, configureCaptchaTokenOptions, resolveCaptchaToken } from './personInput.js'
import { humanText } from '../tenantOutput.js'

type Args = {
	email: string
}

type Options = CaptchaTokenOptions & {
	['mail-project']?: string
	['mail-variant']?: string
}

interface ResetPasswordRequestResult {
	email: string
	requested: true
	mailProject: string | null
	mailVariant: string | null
}

export class TenantPersonResetPasswordRequestCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
		private readonly readStdin: StdinReader = readStdinText,
		private readonly readEnvironment: (name: string) => string | undefined = name => process.env[name],
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description(
			'Send a password-reset e-mail to an address. Consumes the per-IP password-reset rate limit (config rateLimits.passwordResetPerIp, '
				+ 'disabled by default) and reports success even for an unknown address, unless the tenant enables login.revealUserExists.',
		)
		configuration.argument('email').description('E-mail address of the person to send the reset link to.')
		configuration.option('mail-project').valueRequired().description('Project slug whose mail template variant is used.')
		configuration.option('mail-variant').valueRequired().description('Mail template variant, usually a locale.')
		configureCaptchaTokenOptions(configuration)
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const email = input.getArgument('email')
		const mailProject = input.getOption('mail-project')
		const mailVariant = input.getOption('mail-variant')
		const captchaToken = await resolveCaptchaToken(
			{
				'captcha-token': input.getOption('captcha-token'),
				'captcha-token-env': input.getOption('captcha-token-env'),
				'captcha-token-stdin': input.getOption('captcha-token-stdin'),
			},
			this.readStdin,
			this.readEnvironment,
		)

		await this.tenantClientProvider.person().createResetPasswordRequest(email, { mailProject, mailVariant }, captchaToken)

		output.info(`Password reset requested for ${email}. An unknown address is reported as success too, so this is not proof the person exists.`)
		output.data<ResetPasswordRequestResult>({
			email,
			requested: true,
			mailProject: mailProject ?? null,
			mailVariant: mailVariant ?? null,
		}, { human: it => humanText(it.email), quiet: it => it.email })
	}
}
