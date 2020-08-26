import { ChangePasswordErrorCode } from '../../schema'
import { ChangePasswordCommand } from '../commands'
import { CommandBus } from '../commands'
import { isWeakPassword } from '../utils/password'

class PasswordChangeManager {
	constructor(private readonly commandBus: CommandBus) {}

	async changePassword(personId: string, password: string): Promise<PasswordChangeManager.PasswordChangeResult> {
		if (isWeakPassword(password)) {
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
