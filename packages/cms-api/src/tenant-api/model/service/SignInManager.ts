import bcrypt from 'bcrypt'
import { SignInErrorCode } from '../../schema/types'
import QueryHandler from '../../../core/query/QueryHandler'
import DbQueryable from '../../../core/database/DbQueryable'
import ApiKeyManager from './ApiKeyManager'
import PersonQuery from '../queries/person/PersonQuery'
import { PersonRow } from '../queries/person/types'

class SignInManager {
	constructor(
		private readonly queryHandler: QueryHandler<DbQueryable>,
		private readonly apiKeyManager: ApiKeyManager,
	) {}

	async signIn(email: string, password: string, expiration?: number): Promise<SignInManager.SignInResult> {
		const personRow = await this.queryHandler.fetch(PersonQuery.byEmail(email))
		if (personRow === null) {
			return new SignInManager.SignInResultError([SignInErrorCode.UnknownEmail])
		}

		const passwordValid = await bcrypt.compare(password, personRow.password_hash)
		if (!passwordValid) {
			return new SignInManager.SignInResultError([SignInErrorCode.InvalidPassword])
		}

		const sessionToken = await this.apiKeyManager.createSessionApiKey(personRow.identity_id, expiration)
		return new SignInManager.SignInResultOk(personRow, sessionToken)
	}
}

namespace SignInManager {
	export type SignInResult = SignInResultOk | SignInResultError

	export class SignInResultOk {
		readonly ok = true
		constructor(public readonly person: PersonRow, public readonly token: string) {}
	}

	export class SignInResultError {
		readonly ok = false
		constructor(public readonly errors: Array<SignInErrorCode>) {}
	}
}

export default SignInManager
