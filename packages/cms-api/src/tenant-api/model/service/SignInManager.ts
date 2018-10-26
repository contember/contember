import * as bcrypt from 'bcrypt'
import { SignInErrorCode } from '../../schema/types'
import QueryHandler from '../../../core/query/QueryHandler'
import KnexQueryable from '../../../core/knex/KnexQueryable'
import PersonByEmailQuery from '../queries/PersonByEmailQuery'
import ApiKeyManager from './ApiKeyManager'

class SignInManager {
	constructor(
		private readonly queryHandler: QueryHandler<KnexQueryable>,
		private readonly apiKeyManager: ApiKeyManager
	) {}

	async signIn(email: string, password: string): Promise<SignInManager.SignInResult> {
		const personRow = await this.queryHandler.fetch(new PersonByEmailQuery(email))
		if (personRow === null) {
			return new SignInManager.SignInResultError([SignInErrorCode.UNKNOWN_EMAIL])
		}

		const passwordValid = await bcrypt.compare(password, personRow.password_hash)
		if (!passwordValid) {
			return new SignInManager.SignInResultError([SignInErrorCode.INVALID_PASSWORD])
		}

		const sessionToken = await this.apiKeyManager.createSessionApiKey(personRow.identity_id)
		return new SignInManager.SignInResultOk(personRow.id, personRow.identity_id, sessionToken)
	}
}

namespace SignInManager {
	export type SignInResult = SignInResultOk | SignInResultError

	export class SignInResultOk {
		readonly ok = true
		constructor(public readonly personId: string, public readonly identityId: string, public readonly token: string) {}
	}

	export class SignInResultError {
		readonly ok = false
		constructor(public readonly errors: Array<SignInErrorCode>) {}
	}
}

export default SignInManager
