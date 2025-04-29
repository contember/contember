import { ChangeMyPasswordErrorCode, ChangePasswordErrorCode, WeakPasswordReason } from '../../schema'
import { ChangePasswordCommand } from '../commands'
import { Response, ResponseError, ResponseOk } from '../utils/Response'
import { ConfigurationQuery, PersonRow } from '../queries'
import { Providers } from '../providers'
import { DatabaseContext } from '../utils'
import { PasswordStrengthValidator } from './PasswordStrengthValidator'

class PasswordChangeManager {
	constructor(
		private readonly providers: Providers,
		private readonly passwordStrengthVerifier: PasswordStrengthValidator,
	) {}

	async changePassword(dbContext: DatabaseContext, person: PersonRow, password: string): Promise<PasswordChangeManager.PasswordChangeResponse<ChangePasswordErrorCode>> {
		const config = await dbContext.queryHandler.fetch(new ConfigurationQuery())
		const passwordVerifyResult = await this.passwordStrengthVerifier.verify(password, config.password, 'TOO_WEAK')
		if (!passwordVerifyResult.ok) {
			return passwordVerifyResult
		}
		await dbContext.commandBus.execute(new ChangePasswordCommand(person.id, password))
		return new ResponseOk(null)
	}

	async changeMyPassword(dbContext: DatabaseContext, person: PersonRow, currentPassword: string, password: string): Promise<PasswordChangeManager.PasswordChangeResponse<ChangeMyPasswordErrorCode>> {
		const config = await dbContext.queryHandler.fetch(new ConfigurationQuery())
		const passwordVerifyResult = await this.passwordStrengthVerifier.verify(password, config.password, 'TOO_WEAK')
		if (!passwordVerifyResult.ok) {
			return passwordVerifyResult
		}
		if (!person.password_hash) {
			return new ResponseError('NO_PASSWORD_SET', 'No password set')
		}
		if (!(await this.providers.bcryptCompare(currentPassword, person.password_hash))) {
			return new ResponseError('INVALID_PASSWORD', 'Password does not match')
		}

		await dbContext.commandBus.execute(new ChangePasswordCommand(person.id, password))
		return new ResponseOk(null)
	}
}

namespace PasswordChangeManager {
	export type PasswordChangeResponse<T extends ChangePasswordErrorCode | ChangeMyPasswordErrorCode> = Response<null, T, {
		weakPasswordReasons?: WeakPasswordReason[]
	}>
}

export { PasswordChangeManager }
