import { ChangeProfileCommand, ChangeProfileData } from '../commands/person/ChangeProfileCommand.js'
import { Response, ResponseError, ResponseOk } from '../utils/Response.js'
import { PersonQuery, PersonRow } from '../queries/index.js'
import { DatabaseContext } from '../utils/index.js'
import { EmailValidator, EmailValidatorError } from './EmailValidator.js'
import { TogglePersonPasswordlessCommand } from '../commands/index.js'
import { normalizeEmail } from '../utils/email.js'

class PersonManager {
	constructor(
		private readonly emailValidator: EmailValidator,
	) {
	}

	async findPersonById(dbContext: DatabaseContext, personId: string): Promise<PersonRow | null> {
		return await dbContext.queryHandler.fetch(
			PersonQuery.byId(personId),
		)
	}

	async changeProfile(dbContext: DatabaseContext, person: PersonRow, data: ChangeProfileData): Promise<PersonManager.ProfileChangeResponse> {
		// Compare normalized: a case-/whitespace-only edit is not a real change, so
		// it neither needs re-validation nor should drop the verified status.
		const emailChanging = data.email !== undefined && person.email !== normalizeEmail(data.email)
		if (emailChanging) {
			const validationError = await this.emailValidator.validateEmail(dbContext, data.email!)
			if (validationError !== null) {
				return new ResponseError(validationError.error, validationError.errorMessage)
			}
		}
		// On a real e-mail change via the direct path (admin changeProfile, or
		// changeMyProfile when no verification applies) the new address has not
		// been proven, so any prior verification no longer holds — clear it. For
		// verification-required accounts this re-arms the sign-in gate; for the
		// rest email_verified_at was already null, so it is a harmless no-op.
		await dbContext.commandBus.execute(new ChangeProfileCommand(person.id, data, emailChanging))
		return new ResponseOk(null)
	}

	async togglePasswordless(dbContext: DatabaseContext, person: PersonRow, value: boolean): Promise<Response<null, never>> {
		await dbContext.commandBus.execute(new TogglePersonPasswordlessCommand(person.id, value))
		return new ResponseOk(null)
	}
}

namespace PersonManager {
	export type ProfileChangeResponse = Response<null, EmailValidatorError>
}

export { PersonManager }
