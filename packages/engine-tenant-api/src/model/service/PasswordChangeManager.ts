import { ChangePasswordErrorCode } from '../../schema'
import { ChangePasswordCommand, CommandBus } from '../commands'
import { isWeakPassword, MIN_PASSWORD_LENGTH } from '../utils/password'
import { Response, ResponseError, ResponseOk } from '../utils/Response'

class PasswordChangeManager {
	constructor(private readonly commandBus: CommandBus) {}

	async changePassword(personId: string, password: string): Promise<PasswordChangeManager.PasswordChangeResponse> {
		if (isWeakPassword(password)) {
			return new ResponseError(
				ChangePasswordErrorCode.TooWeak,
				`Password is too weak. Minimum length is ${MIN_PASSWORD_LENGTH}`,
			)
		}
		await this.commandBus.execute(new ChangePasswordCommand(personId, password))
		return new ResponseOk(null)
	}
}

namespace PasswordChangeManager {
	export type PasswordChangeResponse = Response<null, ChangePasswordErrorCode>
}

export { PasswordChangeManager }
