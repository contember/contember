import { QueryHandler } from '@contember/queryable'
import { Client, DatabaseQueryable } from '@contember/database'
import { Identity } from '@contember/engine-common'
import { CreateIdentityCommand, CreatePersonCommand, PersonQuery, PersonRow } from '../'
import { SignUpErrorCode } from '../../schema'

class SignUpManager {
	constructor(private readonly queryHandler: QueryHandler<DatabaseQueryable>, private readonly db: Client) {}

	async signUp(email: string, password: string, roles: string[] = []): Promise<SignUpManager.SignUpResult> {
		if (await this.isEmailAlreadyUsed(email)) {
			return new SignUpManager.SignUpResultError([SignUpErrorCode.EmailAlreadyExists])
		}
		if (password.length < 6) {
			return new SignUpManager.SignUpResultError([SignUpErrorCode.TooWeak])
		}
		const person = await this.db.transaction(async wrapper => {
			const identityId = await new CreateIdentityCommand([...roles, Identity.SystemRole.PERSON]).execute(wrapper)
			return await new CreatePersonCommand(identityId, email, password).execute(wrapper)
		})

		return new SignUpManager.SignUpResultOk(person)
	}

	private async isEmailAlreadyUsed(email: string): Promise<boolean> {
		const personOrNull = await this.queryHandler.fetch(PersonQuery.byEmail(email))
		return personOrNull !== null
	}
}

namespace SignUpManager {
	export type SignUpResult = SignUpResultOk | SignUpResultError

	export class SignUpResultOk {
		readonly ok = true

		constructor(public readonly person: PersonRow) {}
	}

	export class SignUpResultError {
		readonly ok = false

		constructor(public readonly errors: Array<SignUpErrorCode>) {}
	}
}

export { SignUpManager }
