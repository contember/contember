import { CreateIdentityCommand, CreatePersonCommand } from '../commands'
import { PersonQuery, PersonRow } from '../queries'
import { SignUpErrorCode } from '../../schema'
import { TenantRole } from '../authorization'
import { isWeakPassword, MIN_PASSWORD_LENGTH } from '../utils/password'
import { Response, ResponseError, ResponseOk } from '../utils/Response'
import { DatabaseContext } from '../utils'

export class SignUpManager {
	constructor(private readonly dbContext: DatabaseContext) {}

	async signUp(email: string, password: string, roles: string[] = []): Promise<SignUpResponse> {
		if (await this.isEmailAlreadyUsed(email)) {
			return new ResponseError(SignUpErrorCode.EmailAlreadyExists, `User with email ${email} already exists`)
		}
		if (isWeakPassword(password)) {
			return new ResponseError(
				SignUpErrorCode.TooWeak,
				`Password is too weak. Minimum length is ${MIN_PASSWORD_LENGTH}`,
			)
		}
		const person = await this.dbContext.transaction(async db => {
			const identityId = await db.commandBus.execute(new CreateIdentityCommand([...roles, TenantRole.PERSON]))
			return await db.commandBus.execute(new CreatePersonCommand(identityId, email, password))
		})
		return new ResponseOk(new SignUpResult(person))
	}

	private async isEmailAlreadyUsed(email: string): Promise<boolean> {
		const personOrNull = await this.dbContext.queryHandler.fetch(PersonQuery.byEmail(email))
		return personOrNull !== null
	}
}

export class SignUpResult {
	constructor(public readonly person: Omit<PersonRow, 'roles'>) {}
}
export type SignUpResponse = Response<SignUpResult, SignUpErrorCode>
