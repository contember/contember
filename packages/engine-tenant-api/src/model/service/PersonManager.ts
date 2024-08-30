import { ChangeProfileCommand, ChangeProfileData } from '../commands/person/ChangeProfileCommand'
import { Response, ResponseError, ResponseOk } from '../utils/Response'
import { PersonQuery, PersonRow } from '../queries'
import { DatabaseContext } from '../utils'
import { EmailValidator, EmailValidatorError } from './EmailValidator'
import { TogglePersonPasswordlessCommand } from '../commands'

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
		if (data.email !== undefined && person.email !== data.email) {
			const validationError = await this.emailValidator.validateEmail(dbContext, data.email)
			if (validationError !== null) {
				return new ResponseError(validationError.error, validationError.errorMessage)
			}
		}
		await dbContext.commandBus.execute(new ChangeProfileCommand(person.id, data))
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
