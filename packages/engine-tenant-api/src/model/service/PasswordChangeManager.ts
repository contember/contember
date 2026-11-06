import { ChangeMyPasswordErrorCode, ChangePasswordErrorCode, WeakPasswordReason } from '../../schema/index.js'
import { ChangePasswordCommand, RevokePersonSessionsCommand } from '../commands/index.js'
import { Response, ResponseError, ResponseOk } from '../utils/Response.js'
import { ConfigurationQuery, PersonRow } from '../queries/index.js'
import { Providers } from '../providers.js'
import { DatabaseContext } from '../utils/index.js'
import { PasswordStrengthValidator } from './PasswordStrengthValidator.js'

class PasswordChangeManager {
	constructor(
		private readonly providers: Providers,
		private readonly passwordStrengthVerifier: PasswordStrengthValidator,
	) {}

	async changePassword(
		dbContext: DatabaseContext,
		person: PersonRow,
		password: string,
	): Promise<PasswordChangeManager.PasswordChangeResponse<ChangePasswordErrorCode>> {
		const config = await dbContext.queryHandler.fetch(new ConfigurationQuery(dbContext.providers))
		const passwordVerifyResult = await this.passwordStrengthVerifier.verify(password, config.password, 'TOO_WEAK')
		if (!passwordVerifyResult.ok) {
			return passwordVerifyResult
		}
		await this.setPassword(dbContext, person, password, config.password.revokeSessionsOnChange, null)
		return new ResponseOk(null)
	}

	async changeMyPassword(
		dbContext: DatabaseContext,
		person: PersonRow,
		currentPassword: string,
		password: string,
		currentApiKeyId: string,
	): Promise<PasswordChangeManager.PasswordChangeResponse<ChangeMyPasswordErrorCode>> {
		const config = await dbContext.queryHandler.fetch(new ConfigurationQuery(dbContext.providers))
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

		await this.setPassword(dbContext, person, password, config.password.revokeSessionsOnChange, currentApiKeyId)
		return new ResponseOk(null)
	}

	private async setPassword(
		dbContext: DatabaseContext,
		person: PersonRow,
		password: string,
		revokeSessions: boolean,
		keepApiKeyId: string | null,
	): Promise<void> {
		if (!revokeSessions) {
			await dbContext.commandBus.execute(new ChangePasswordCommand(person.id, password))
			return
		}
		await dbContext.transaction(async db => {
			await db.commandBus.execute(new ChangePasswordCommand(person.id, password))
			await db.commandBus.execute(new RevokePersonSessionsCommand(person.id, keepApiKeyId))
		})
	}
}

namespace PasswordChangeManager {
	export type PasswordChangeResponse<T extends ChangePasswordErrorCode | ChangeMyPasswordErrorCode> = Response<null, T, {
		weakPasswordReasons?: WeakPasswordReason[]
	}>
}

export { PasswordChangeManager }
