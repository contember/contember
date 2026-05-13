import { CreateIdentityCommand, CreatePersonCommand } from '../commands'
import { ConfigurationQuery, PersonRow } from '../queries'
import { SignUpErrorCode, SignUpRecommendedAction, WeakPasswordReason } from '../../schema'
import { TenantRole } from '../authorization'
import { Response, ResponseError, ResponseOk } from '../utils/Response'
import { DatabaseContext } from '../utils'
import { MaybePassword } from '../dtos'
import { EmailValidator } from './EmailValidator'
import { PasswordStrengthValidator } from './PasswordStrengthValidator'
import { CaptchaValidator } from './captcha'
import { RateLimiter } from './RateLimiter'
import { UserMailer } from '../mailing'
import { validateEmail as isEmailFormatValid } from '../utils/email'

type SignUpUser = {
	email: string
	name?: string
	password: MaybePassword
	roles?: readonly string[]
	captchaToken?: string | null
	remoteIp?: string
}

export class SignUpManager {
	constructor(
		private readonly emailValidator: EmailValidator,
		private readonly passwordStrengthValidator: PasswordStrengthValidator,
		private readonly captchaValidator: CaptchaValidator,
		private readonly rateLimiter: RateLimiter,
		private readonly userMailer: UserMailer,
	) {
	}

	async signUp(dbContext: DatabaseContext, args: SignUpUser): Promise<SignUpResponse> {
		const { email, password, roles = [], captchaToken, remoteIp } = args
		const config = await dbContext.queryHandler.fetch(new ConfigurationQuery())

		const rl = await this.rateLimiter.consume(dbContext, 'sign_up_per_ip', remoteIp, config)
		if (!rl.ok) {
			return new ResponseError(
				'RATE_LIMIT_EXCEEDED',
				`Too many sign-up attempts. Retry after ${rl.retryAfterSeconds}s.`,
			)
		}

		const captchaConfig = this.captchaValidator.extractConfig(config)
		if (this.captchaValidator.isEnabled(captchaConfig)) {
			const captcha = await this.captchaValidator.verify({ config: captchaConfig, token: captchaToken, remoteIp })
			if (!captcha.ok) {
				return new ResponseError('INVALID_CAPTCHA', `Captcha verification failed: ${captcha.reason}`)
			}
		}

		if (!isEmailFormatValid(email.trim())) {
			return new ResponseError('INVALID_EMAIL_FORMAT', 'E-mail address is not in a valid format')
		}

		const existingPerson = await this.emailValidator.findExistingPerson(dbContext, email)
		if (existingPerson !== null) {
			const recommendedAction: SignUpRecommendedAction = existingPerson.password_hash ? 'SIGN_IN' : 'RESET_PASSWORD'

			if (!config.login.revealUserExists) {
				// Silent: tell the legitimate account holder, but reply OK to the caller so
				// the endpoint does not become an account-enumeration oracle.
				if (existingPerson.email) {
					await this.userMailer.sendRegistrationAttemptExistingUserEmail(
						dbContext,
						{ email: existingPerson.email },
						{ projectId: null, variant: '' },
					)
				}
				return new ResponseOk(new SignUpResult(null, recommendedAction))
			}

			return new ResponseError(
				'ALREADY_REGISTERED',
				`User with email ${email} already exists`,
				{ recommendedAction },
			)
		}

		const plainPassword = password.getPlain()

		if (plainPassword) {
			const passwordVerifyResult = await this.passwordStrengthValidator.verify(plainPassword, config.password, 'TOO_WEAK')
			if (!passwordVerifyResult.ok) {
				return passwordVerifyResult
			}
		}

		const person = await dbContext.transaction(async db => {
			const identityId = await db.commandBus.execute(new CreateIdentityCommand([...roles, TenantRole.PERSON]))
			return await db.commandBus.execute(new CreatePersonCommand({ identityId, email, password }))
		})
		return new ResponseOk(new SignUpResult(person))
	}
}

export class SignUpResult {
	constructor(
		public readonly person: Omit<PersonRow, 'roles'> | null,
		public readonly recommendedAction: SignUpRecommendedAction | null = null,
	) {}
}

export type SignUpResponse = Response<SignUpResult, SignUpErrorCode, {
	weakPasswordReasons?: WeakPasswordReason[]
	recommendedAction?: SignUpRecommendedAction
}>
