import { ChangeMyPasswordErrorCode, ChangePasswordErrorCode } from '../../schema/index.js'
import { ChangePasswordCommand } from '../commands/index.js'
import { getPasswordWeaknessMessage } from '../utils/password.js'
import { Response, ResponseError, ResponseOk } from '../utils/Response.js'
import { PersonRow } from '../queries/index.js'
import { Providers } from '../providers.js'
import { DatabaseContext } from '../utils/index.js'

class PasswordChangeManager {
	constructor(
		private readonly providers: Providers,
	) {}

	async changePassword(dbContext: DatabaseContext, personId: string, password: string): Promise<PasswordChangeManager.PasswordChangeResponse<ChangePasswordErrorCode>> {
		const weakPassword = getPasswordWeaknessMessage(password)
		if (weakPassword) {
			return new ResponseError(ChangePasswordErrorCode.TooWeak, weakPassword)
		}
		await dbContext.commandBus.execute(new ChangePasswordCommand(personId, password))
		return new ResponseOk(null)
	}

	async changeMyPassword(dbContext: DatabaseContext, person: PersonRow, currentPassword: string, password: string): Promise<PasswordChangeManager.PasswordChangeResponse<ChangeMyPasswordErrorCode>> {
		const weakPassword = getPasswordWeaknessMessage(password)
		if (weakPassword) {
			return new ResponseError(ChangeMyPasswordErrorCode.TooWeak, weakPassword)
		}
		if (!person.password_hash) {
			return new ResponseError(ChangeMyPasswordErrorCode.NoPasswordSet, 'No password set')
		}
		if (!(await this.providers.bcryptCompare(currentPassword, person.password_hash))) {
			return new ResponseError(ChangeMyPasswordErrorCode.InvalidPassword, 'Password does not match')
		}

		await dbContext.commandBus.execute(new ChangePasswordCommand(person.id, password))
		return new ResponseOk(null)
	}
}

namespace PasswordChangeManager {
	export type PasswordChangeResponse<T extends ChangePasswordErrorCode | ChangeMyPasswordErrorCode> = Response<null, T>
}

export { PasswordChangeManager }
