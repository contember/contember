import { PersonQuery } from '../queries'
import { DatabaseContext } from '../utils'
import { DisablePersonCommand } from '../commands/person/DisablePersonCommand'

class PersonAccessManager {

	async disablePerson(dbContext: DatabaseContext, personId: string): Promise<PersonDisableAccessErrorCode | null> {
		return await dbContext.transaction(async trx => {
			const personRow = await trx.queryHandler.fetch(
				PersonQuery.byId(personId),
			)

			if (personRow === null) {
				return PersonDisableAccessErrorCode.PERSON_NOT_FOUND
			}

			if (personRow.disable) {
				return PersonDisableAccessErrorCode.PERSON_ALREADY_DISABLED
			}

			await trx.commandBus.execute(new DisablePersonCommand(personId))

			// TODO: Disable auth tokens
			// TODO: Disable person

			return null
		})
	}


	// FIXME
	async validateAbilityToDisablePerson(): Promise<boolean> {
		return true
	}




}

export enum PersonDisableAccessErrorCode {
	PERSON_NOT_FOUND = 'PERSON_NOT_FOUND',
	PERSON_ALREADY_DISABLED = 'PERSON_ALREADY_DISABLED',
}

export { PersonAccessManager }
