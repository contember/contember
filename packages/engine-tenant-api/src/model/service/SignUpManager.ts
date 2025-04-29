import { CreateIdentityCommand, CreatePersonCommand } from '../commands'
import { ConfigurationQuery, PersonRow } from '../queries'
import { SignUpErrorCode, WeakPasswordReason } from '../../schema'
import { TenantRole } from '../authorization'
import { Response, ResponseOk } from '../utils/Response'
import { DatabaseContext } from '../utils'
import { MaybePassword } from '../dtos'
import { EmailValidator } from './EmailValidator'
import { PasswordStrengthValidator } from './PasswordStrengthValidator'

type SignUpUser = {
	email: string
	name?: string
	password: MaybePassword
	roles?: readonly string[]
}

export class SignUpManager {
	constructor(
		private readonly emailValidator: EmailValidator,
		private readonly passwordStrengthValidator: PasswordStrengthValidator,
	) {
	}

	async signUp(dbContext: DatabaseContext, { email, password, roles = [] }: SignUpUser): Promise<SignUpResponse> {
		const validationError = await this.emailValidator.validateEmail(dbContext, email)
		if (validationError !== null) {
			return validationError
		}
		const plainPassword = password.getPlain()

		if (plainPassword) {
			const config = await dbContext.queryHandler.fetch(new ConfigurationQuery())
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
}>
