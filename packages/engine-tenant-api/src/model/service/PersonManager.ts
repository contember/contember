import { ChangeMyProfileErrorCode } from '../../schema'
import { ChangeProfileCommand, ChangeProfileData } from '../commands/person/ChangeProfileCommand'
import { Response, ResponseError, ResponseOk } from '../utils/Response'
import { PersonQuery, PersonRow } from '../queries'
import { DatabaseContext } from '../utils'
import { EmailValidator } from './EmailValidator'

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

	async changeMyProfile(dbContext: DatabaseContext, person: PersonRow, data: ChangeProfileData): Promise<PersonManager.ProfileChangeResponse> {
		if (data.email !== undefined && person.email !== data.email) {
			const validationError = await this.emailValidator.validateEmail(dbContext, data.email)
			if (validationError !== null) {
				return new ResponseError(validationError.error, validationError.errorMessage)
			}
		}
		await dbContext.commandBus.execute(new ChangeProfileCommand(person.id, data))
		return new ResponseOk(null)
	}

}

namespace PersonManager {
	export type ProfileChangeResponse = Response<null, ChangeMyProfileErrorCode>
}

export { PersonManager }
