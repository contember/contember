import { CreateIdentityCommand, CreatePersonCommand } from '../commands'
import { PersonRow } from '../queries'
import { SignUpErrorCode, SignUpRecommendedAction, WeakPasswordReason } from '../../schema'
import { TenantRole } from '../authorization'
import { Response, ResponseError, ResponseOk } from '../utils/Response'
import { DatabaseContext } from '../utils'
import { MaybePassword } from '../dtos'
import { EmailValidator } from './EmailValidator'
import { PasswordStrengthValidator } from './PasswordStrengthValidator'
import { validateEmail as isEmailFormatValid } from '../utils/email'
import { Config } from '../type/Config'

type SignUpUser = {
	email: string
	name?: string
	password: MaybePassword
	roles?: readonly string[]
	config: Config
}

export class SignUpManager {
	constructor(
		private readonly emailValidator: EmailValidator,
		private readonly passwordStrengthValidator: PasswordStrengthValidator,
	) {
	}

	async signUp(dbContext: DatabaseContext, args: SignUpUser): Promise<SignUpResponse> {
		const { email, password, roles = [], config } = args

		if (!isEmailFormatValid(email.trim())) {
			return new ResponseError('INVALID_EMAIL_FORMAT', 'E-mail address is not in a valid format')
		}

		const existingPerson = await this.emailValidator.findExistingPerson(dbContext, email)
		if (existingPerson !== null) {
			const exposeMethod = config.login.revealUserExists && config.login.revealLoginMethod
			const recommendedAction: SignUpRecommendedAction | undefined = exposeMethod
				? (existingPerson.password_hash ? 'SIGN_IN' : 'RESET_PASSWORD')
				: undefined
			return new ResponseError(
				'EMAIL_ALREADY_EXISTS',
				`User with email ${email} already exists`,
				recommendedAction ? { recommendedAction } : undefined,
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
	constructor(public readonly person: Omit<PersonRow, 'roles'>) {}
}

export type SignUpResponse = Response<SignUpResult, SignUpErrorCode, {
	weakPasswordReasons?: WeakPasswordReason[]
	recommendedAction?: SignUpRecommendedAction
}>
