import { ChangeMyPasswordErrorCode, ChangePasswordErrorCode } from '../../schema'
import { ChangePasswordCommand } from '../commands'
import { getPasswordWeaknessMessage } from '../utils/password'
import { Response, ResponseError, ResponseOk } from '../utils/Response'
import { PersonRow } from '../queries'
import { Providers } from '../providers'
import { DatabaseContext } from '../utils'

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
