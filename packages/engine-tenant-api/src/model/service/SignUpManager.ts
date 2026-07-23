import { CreateIdentityCommand, CreatePersonCommand } from '../commands/index.js'
import { PersonRow } from '../queries/index.js'
import { SignUpErrorCode, SignUpRecommendedAction, WeakPasswordReason } from '../../schema/index.js'
import { TenantRole } from '../authorization/index.js'
import { Response, ResponseError, ResponseOk } from '../utils/Response.js'
import { DatabaseContext } from '../utils/index.js'
import { MaybePassword } from '../dtos/index.js'
import { EmailValidator } from './EmailValidator.js'
import { PasswordStrengthValidator } from './PasswordStrengthValidator.js'
import { validateEmail as isEmailFormatValid } from '../utils/email.js'
import { Config } from '../type/Config.js'
import { GlobalRoleValidator } from './GlobalRoleValidator.js'

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
		private readonly globalRoleValidator: GlobalRoleValidator = new GlobalRoleValidator(),
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

		// Freeze the requirement onto the person at sign-up time. Flipping the
		// tenant-wide flag later must not retroactively lock out accounts that
		// were created while verification was optional.
		const emailVerificationRequired = config.signup.requireEmailVerification

		const created = await dbContext.transaction(async db => {
			const invalidRole = await this.globalRoleValidator.findInvalidRole(db, roles)
			if (invalidRole !== null) {
				return { invalidRole }
			}
			const identityId = await db.commandBus.execute(new CreateIdentityCommand([...roles, TenantRole.PERSON]))
			const person = await db.commandBus.execute(new CreatePersonCommand({ identityId, email, password, emailVerificationRequired }))
			return { person }
		})
		if ('invalidRole' in created) {
			return new ResponseError('INVALID_ROLE', `Role ${created.invalidRole} is not valid or globally assignable`)
		}
		return new ResponseOk(new SignUpResult(created.person, emailVerificationRequired))
	}
}

export class SignUpResult {
	constructor(
		public readonly person: Omit<PersonRow, 'roles'>,
		public readonly emailVerificationRequired: boolean = false,
	) {}
}

export type SignUpResponse = Response<SignUpResult, SignUpErrorCode, {
	weakPasswordReasons?: WeakPasswordReason[]
	recommendedAction?: SignUpRecommendedAction
}>
