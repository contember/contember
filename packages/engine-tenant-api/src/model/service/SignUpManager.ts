import { CreateIdentityCommand, CreatePersonCommand } from '../commands'
import { PersonQuery, PersonRow } from '../queries'
import { SignUpErrorCode } from '../../schema'
import { TenantRole } from '../authorization'
import { getPasswordWeaknessMessage } from '../utils/password'
import { Response, ResponseError, ResponseOk } from '../utils/Response'
import { DatabaseContext } from '../utils'

export class SignUpManager {
	async signUp(dbContext: DatabaseContext, email: string, password: string, roles: readonly string[] = []): Promise<SignUpResponse> {
		if (await this.isEmailAlreadyUsed(dbContext, email)) {
			return new ResponseError(SignUpErrorCode.EmailAlreadyExists, `User with email ${email} already exists`)
		}
		const weakPassword = getPasswordWeaknessMessage(password)
		if (weakPassword) {
			return new ResponseError(SignUpErrorCode.TooWeak, weakPassword)
		}
		const person = await dbContext.transaction(async db => {
			const identityId = await db.commandBus.execute(new CreateIdentityCommand([...roles, TenantRole.PERSON]))
			return await db.commandBus.execute(new CreatePersonCommand(identityId, email, password))
		})
		return new ResponseOk(new SignUpResult(person))
	}

	private async isEmailAlreadyUsed(dbContext: DatabaseContext, email: string): Promise<boolean> {
		const personOrNull = await dbContext.queryHandler.fetch(PersonQuery.byEmail(email))
		return personOrNull !== null
	}
}

export class SignUpResult {
	constructor(public readonly person: Omit<PersonRow, 'roles'>) {}
}
export type SignUpResponse = Response<SignUpResult, SignUpErrorCode>
