import { QueryHandler } from '@contember/queryable'
import { DatabaseQueryable } from '@contember/database'
import { CreateIdentityCommand, CreatePersonCommand } from '../commands'
import { PersonQuery, PersonRow } from '../queries'
import { SignUpErrorCode } from '../../schema'
import { CommandBus } from '../commands/CommandBus'
import { TenantRole } from '../authorization/Roles'
import { isWeakPassword } from '../utils/password'

class SignUpManager {
	constructor(
		private readonly queryHandler: QueryHandler<DatabaseQueryable>,
		private readonly commandBus: CommandBus,
	) {}

	async signUp(email: string, password: string, roles: string[] = []): Promise<SignUpManager.SignUpResult> {
		if (await this.isEmailAlreadyUsed(email)) {
			return new SignUpManager.SignUpResultError([SignUpErrorCode.EmailAlreadyExists])
		}
		if (isWeakPassword(password)) {
			return new SignUpManager.SignUpResultError([SignUpErrorCode.TooWeak])
		}
		const person = await this.commandBus.transaction(async bus => {
			const identityId = await bus.execute(new CreateIdentityCommand([...roles, TenantRole.PERSON]))
			return await bus.execute(new CreatePersonCommand(identityId, email, password))
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

		constructor(public readonly person: Omit<PersonRow, 'roles'>) {}
	}

	export class SignUpResultError {
		readonly ok = false

		constructor(public readonly errors: Array<SignUpErrorCode>) {}
	}
}

export { SignUpManager }
