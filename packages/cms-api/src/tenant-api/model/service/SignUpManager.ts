import QueryHandler from '../../../core/query/QueryHandler'
import DbQueryable from '../../../core/database/DbQueryable'
import { SignUpErrorCode } from '../../schema/types'
import Client from '../../../core/database/Client'
import CreateIdentityCommand from '../commands/CreateIdentityCommand'
import CreatePersonCommand from '../commands/CreatePersonCommand'
import Identity from '../../../common/auth/Identity'
import PersonQuery from '../queries/person/PersonQuery'
import { PersonRow } from '../queries/person/types'

class SignUpManager {
	constructor(private readonly queryHandler: QueryHandler<DbQueryable>, private readonly db: Client) {}

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

export default SignUpManager
