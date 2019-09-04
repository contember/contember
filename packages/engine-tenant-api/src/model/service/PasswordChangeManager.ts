import { ChangePasswordErrorCode } from '../../schema'
import { ChangePasswordCommand } from '../'
import { Client } from '@contember/database'
import { CommandBus } from '../commands/CommandBus'

class PasswordChangeManager {
	constructor(private readonly commandBus: CommandBus) {}

	async changePassword(personId: string, password: string): Promise<PasswordChangeManager.PasswordChangeResult> {
		if (password.length < 6) {
			return new PasswordChangeManager.PasswordChangeResultError([ChangePasswordErrorCode.TooWeak])
		}
		await this.commandBus.execute(new ChangePasswordCommand(personId, password))
		return new PasswordChangeManager.PasswordChangeResultOk()
	}
}

namespace PasswordChangeManager {
	export type PasswordChangeResult = PasswordChangeResultOk | PasswordChangeResultError

	export class PasswordChangeResultOk {
		readonly ok = true
	}

	export class PasswordChangeResultError {
		readonly ok = false

		constructor(public readonly errors: Array<ChangePasswordErrorCode>) {}
	}
}

export { PasswordChangeManager }
