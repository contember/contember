import { ChangeMyPasswordErrorCode, ChangePasswordErrorCode } from '../../schema'
import { ChangePasswordCommand } from '../commands'
import { getPasswordWeaknessMessage } from '../utils/password'
import { Response, ResponseError, ResponseOk } from '../utils/Response'
import { DatabaseContext } from '../utils'
import { PersonRow } from '../queries'
import { Providers } from '../providers'

class PasswordChangeManager {
	constructor(
		private readonly dbContext: DatabaseContext,
		private readonly providers: Providers,
	) {}

	async changePassword(personId: string, password: string): Promise<PasswordChangeManager.PasswordChangeResponse<ChangePasswordErrorCode>> {
		const weakPassword = getPasswordWeaknessMessage(password)
		if (weakPassword) {
			return new ResponseError(ChangePasswordErrorCode.TooWeak, weakPassword)
		}
		await this.dbContext.commandBus.execute(new ChangePasswordCommand(personId, password))
		return new ResponseOk(null)
	}

	async changeMyPassword(person: PersonRow, currentPassword: string, password: string): Promise<PasswordChangeManager.PasswordChangeResponse<ChangeMyPasswordErrorCode>> {
		const weakPassword = getPasswordWeaknessMessage(password)
		if (weakPassword) {
			return new ResponseError(ChangeMyPasswordErrorCode.TooWeak, weakPassword)
		}
		if (!(await this.providers.bcryptCompare(currentPassword, person.password_hash))) {
			return new ResponseError(ChangeMyPasswordErrorCode.InvalidPassword, 'Password does not match')
		}

		await this.dbContext.commandBus.execute(new ChangePasswordCommand(person.id, password))
		return new ResponseOk(null)
	}
}

namespace PasswordChangeManager {
	export type PasswordChangeResponse<T extends ChangePasswordErrorCode | ChangeMyPasswordErrorCode> = Response<null, T>
}

export { PasswordChangeManager }
