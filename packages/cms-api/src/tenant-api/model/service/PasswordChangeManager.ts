import { ChangePasswordErrorCode } from '../../schema/types'
import ChangePasswordCommand from '../commands/ChangePasswordCommand'
import Client from '../../../core/database/Client'

class PasswordChangeManager {
	constructor(private readonly db: Client) {}

	async changePassword(personId: string, password: string): Promise<PasswordChangeManager.PasswordChangeResult> {
		if (password.length < 6) {
			return new PasswordChangeManager.PasswordChangeResultError([ChangePasswordErrorCode.TooWeak])
		}
		await new ChangePasswordCommand(personId, password).execute(this.db)
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

export default PasswordChangeManager
