import { PersonQuery, PersonRow } from '../queries/index.js'
import { DatabaseContext } from '../utils/index.js'
import { DisablePersonCommand } from '../commands/person/DisablePersonCommand.js'
import { ApiKeyManager } from './apiKey/index.js'
import { Response, ResponseError, ResponseOk } from '../utils/Response.js'
import { DisablePersonErrorCode } from '../../schema/index.js'
import { Connection } from '@contember/database'

class PersonAccessManager {
	constructor(private readonly apiKeyManager: ApiKeyManager) {}

	async disablePerson(dbContext: DatabaseContext, person: PersonRow): Promise<PersonDisableAccessResponse> {
		return await dbContext.transaction(trx => this.disablePersonInTransaction(trx, person))
	}

	async disablePersonInTransaction(
		dbContext: DatabaseContext<Connection.TransactionLike>,
		person: PersonRow,
	): Promise<PersonDisableAccessResponse> {
		if (person.disabled_at !== null) {
			return new ResponseError('PERSON_ALREADY_DISABLED', 'Person is already disabled')
		}

		// Deactivate person & invalidate all api keys associated with person identity
		await this.disablePersonAccount(dbContext, person.id)
		await this.disableIdentityApiKeys(dbContext, person.identity_id)

		return new ResponseOk(null)
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
