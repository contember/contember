import { PersonQuery, PersonRow } from '../queries/index.js'
import { DatabaseContext } from '../utils/index.js'
import { DisablePersonCommand } from '../commands/person/DisablePersonCommand.js'
import { ApiKeyManager } from './apiKey/index.js'
import { Response, ResponseError, ResponseOk } from '../utils/Response.js'
import { DisablePersonErrorCode } from '../../schema/index.js'

class PersonAccessManager {
	constructor(private readonly apiKeyManager: ApiKeyManager) {}

	async disablePerson(dbContext: DatabaseContext, person: PersonRow): Promise<PersonDisableAccessResponse> {
		return await dbContext.transaction(async trx => {
			if (person.disabled_at !== null) {
				return new ResponseError('PERSON_ALREADY_DISABLED', 'Person is already disabled')
			}

			// Deactivate person & invalidate all api keys associated with person identity
			await this.disablePersonAccount(trx, person.id)
			await this.disableIdentityApiKeys(trx, person.identity_id)

			return new ResponseOk(null)
		})
	}

	private async disablePersonAccount(dbContext: DatabaseContext, personId: string) {
		await dbContext.commandBus.execute(new DisablePersonCommand(personId))
	}

	private async disableIdentityApiKeys(dbContext: DatabaseContext, personIdentityId: string) {
		await this.apiKeyManager.disableIdentityApiKeys(dbContext, personIdentityId)
	}
}

export type PersonDisableAccessResponse = Response<null, DisablePersonErrorCode>

export { PersonAccessManager }
