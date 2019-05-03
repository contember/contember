import QueryHandler from '../../../core/query/QueryHandler'
import DbQueryable from '../../../core/database/DbQueryable'
import PersonByEmailQuery from '../queries/PersonByEmailQuery'
import { SignUpErrorCode } from '../../schema/types'
import Client from '../../../core/database/Client'
import CreateIdentityCommand from '../commands/CreateIdentityCommand'
import CreatePersonCommand from '../commands/CreatePersonCommand'

class SignUpManager {
	constructor(private readonly queryHandler: QueryHandler<DbQueryable>, private readonly db: Client) {}

	async signUp(email: string, password: string, roles: string[] = []): Promise<SignUpManager.SignUpResult> {
		if (await this.isEmailAlreadyUsed(email)) {
			return new SignUpManager.SignUpResultError([SignUpErrorCode.EmailAlreadyExists])
		}
		if (password.length < 6) {
			return new SignUpManager.SignUpResultError([SignUpErrorCode.TooWeak])
		}
		const [identityId, personId] = await this.db.transaction(async wrapper => {
			const identityId = await new CreateIdentityCommand(roles).execute(wrapper)
			const personId = await new CreatePersonCommand(identityId, email, password).execute(wrapper)
			return [identityId, personId]
		})

		return new SignUpManager.SignUpResultOk(personId, identityId)
	}

	private async isEmailAlreadyUsed(email: string): Promise<boolean> {
		const personOrNull = await this.queryHandler.fetch(new PersonByEmailQuery(email))
		return personOrNull !== null
	}
}

namespace SignUpManager {
	export type SignUpResult = SignUpResultOk | SignUpResultError

	export class SignUpResultOk {
		readonly ok = true

		constructor(public readonly personId: string, public readonly identityId: string) {}
	}

	export class SignUpResultError {
		readonly ok = false

		constructor(public readonly errors: Array<SignUpErrorCode>) {}
	}
}

export default SignUpManager
