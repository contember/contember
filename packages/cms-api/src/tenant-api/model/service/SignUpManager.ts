import QueryHandler from '../../../core/query/QueryHandler'
import KnexQueryable from '../../../core/knex/KnexQueryable'
import PersonByEmailQuery from '../queries/PersonByEmailQuery'
import { SignUpErrorCode } from '../../schema/types'
import KnexConnection from '../../../core/knex/KnexConnection'
import * as uuid from 'uuid'
import * as bcrypt from 'bcrypt'

class SignUpManager {
	constructor(private readonly queryHandler: QueryHandler<KnexQueryable>, private readonly db: KnexConnection) {}

	async signUp(email: string, password: string): Promise<SignUpManager.SignUpResult> {
		if (await this.isEmailAlreadyUsed(email)) {
			return new SignUpManager.SignUpResultError([SignUpErrorCode.EMAIL_ALREADY_EXISTS])
		}

		const identityId = uuid.v4()
		const personId = uuid.v4()

		await this.db.transaction(async () => {
			await this.db
				.queryBuilder()
				.into('tenant.identity')
				.insert({
					id: identityId,
					parent_id: null,
					roles: JSON.stringify([]) // TODO: try without JSON.stringify
				})

			await this.db
				.queryBuilder()
				.into('tenant.person')
				.insert({
					id: personId,
					email: email,
					password_hash: await bcrypt.hash(password, 10),
					identity_id: identityId
				})
		})

		return new SignUpManager.SignUpResultOk(personId)
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
		constructor(public readonly personId: string) {}
	}

	export class SignUpResultError {
		readonly ok = false
		constructor(public readonly errors: Array<SignUpErrorCode>) {}
	}
}

export default SignUpManager
