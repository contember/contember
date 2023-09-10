import { } from '../../schema'
import { ChangeProfileCommand } from '../commands/person/ChangeProfileCommand'
import { Response, ResponseOk } from '../utils/Response'
import { PersonQuery, PersonRow } from '../queries'
import { DatabaseContext } from '../utils'

class PersonManager {

	async findPersonById(dbContext: DatabaseContext, personId: string): Promise<PersonRow | null> {
		return await dbContext.queryHandler.fetch(
			PersonQuery.byId(personId),
		)
	}

	async changeMyProfile(dbContext: DatabaseContext, person: PersonRow, email?: string, name?: string | null): Promise<PersonManager.ProfileChangeResponse> {
		await dbContext.commandBus.execute(new ChangeProfileCommand(person.id, email, name))
		return new ResponseOk(null)
	}

}

namespace PersonManager {
	export type ProfileChangeResponse = Response<null, null>
}

export { PersonManager }
