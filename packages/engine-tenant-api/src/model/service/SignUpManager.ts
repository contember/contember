import { CreateIdentityCommand, CreatePersonCommand } from '../commands/index.js'
import { PersonQuery, PersonRow } from '../queries/index.js'
import { SignUpErrorCode } from '../../schema/index.js'
import { TenantRole } from '../authorization/index.js'
import { getPasswordWeaknessMessage } from '../utils/password.js'
import { Response, ResponseError, ResponseOk } from '../utils/Response.js'
import { DatabaseContext } from '../utils/index.js'
import { MaybePassword } from '../dtos/index.js'

export class SignUpManager {
	async signUp(dbContext: DatabaseContext, email: string, password: MaybePassword, roles: readonly string[] = []): Promise<SignUpResponse> {
		if (await this.isEmailAlreadyUsed(dbContext, email)) {
			return new ResponseError(SignUpErrorCode.EmailAlreadyExists, `User with email ${email} already exists`)
		}
		const plainPassword = password.getPlain()
		const weakPassword = plainPassword ? getPasswordWeaknessMessage(plainPassword) : null
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
