import { PersonQuery, PersonRow } from '../queries'
import { DatabaseContext } from '../utils'

class PersonManager {

	async findPersonById(dbContext: DatabaseContext, personId: string): Promise<PersonRow | null> {
		return await dbContext.queryHandler.fetch(
			PersonQuery.byId(personId),
		)
	}

}

export { PersonManager }
