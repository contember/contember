import { PersonQuery } from '../queries'
import { DatabaseContext } from '../utils'
import { DisablePersonCommand } from '../commands/person/DisablePersonCommand'
import { ApiKeyManager } from './apiKey'

class PersonAccessManager {

	constructor(private readonly apiKeyManager: ApiKeyManager) {}

	async disablePerson(dbContext: DatabaseContext, personId: string): Promise<PersonDisableAccessErrorCode | null> {
		return await dbContext.transaction(async trx => {
			const personRow = await trx.queryHandler.fetch(
				PersonQuery.byId(personId),
			)

			if (personRow === null) {
				return PersonDisableAccessErrorCode.PERSON_NOT_FOUND
			}

			if (personRow.disabled_at !== null) {
				return PersonDisableAccessErrorCode.PERSON_ALREADY_DISABLED
			}

			// Deactivate person & invalidate all api keys associated with person identity
			await this.disablePersonAccount(trx, personRow.id)
			await this.disableIdentityApiKeys(trx, personRow.identity_id)

			return null
		})
	}

	async disablePersonAccount(dbContext: DatabaseContext, personId: string) {
		await dbContext.commandBus.execute(new DisablePersonCommand(personId))
	}

	async disableIdentityApiKeys(dbContext: DatabaseContext, personIdentityId: string) {
		await this.apiKeyManager.disableIdentityApiKeys(dbContext, personIdentityId)
	}
}

export enum PersonDisableAccessErrorCode {
	PERSON_NOT_FOUND = 'PERSON_NOT_FOUND',
	PERSON_ALREADY_DISABLED = 'PERSON_ALREADY_DISABLED',
}

export { PersonAccessManager }
