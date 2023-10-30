import { CreateIdentityCommand, CreatePersonCommand } from '../commands'
import { PersonQuery, PersonRow } from '../queries'
import { SignUpErrorCode } from '../../schema'
import { TenantRole } from '../authorization'
import { getPasswordWeaknessMessage } from '../utils/password'
import { Response, ResponseError, ResponseOk } from '../utils/Response'
import { DatabaseContext } from '../utils'
import { MaybePassword } from '../dtos'
import { EmailValidator } from './EmailValidator'

type SignUpUser = {
	email: string
	name?: string
	password: MaybePassword
	roles?: readonly string[]
}

export class SignUpManager {
	constructor(
		private readonly emailValidator: EmailValidator,
	) {
	}

	async signUp(dbContext: DatabaseContext, { email, password, roles = [] }: SignUpUser): Promise<SignUpResponse> {
		const validationError = await this.emailValidator.validateEmail(dbContext, email)
		if (validationError !== null) {
			return validationError
		}
		const plainPassword = password.getPlain()
		const weakPassword = plainPassword ? getPasswordWeaknessMessage(plainPassword) : null
		if (weakPassword) {
			return new ResponseError('TOO_WEAK', weakPassword)
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
export type SignUpResponse = Response<SignUpResult, SignUpErrorCode>
