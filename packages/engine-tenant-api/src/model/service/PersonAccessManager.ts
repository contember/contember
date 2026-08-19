import { Logger } from '@contember/logger'
import { PersonQuery, PersonRow } from '../queries'
import { DatabaseContext } from '../utils'
import { DisablePersonCommand } from '../commands/person/DisablePersonCommand'
import { ApiKeyManager } from './apiKey'
import { Response, ResponseError, ResponseOk } from '../utils/Response'
import { DisablePersonErrorCode } from '../../schema'

class PersonAccessManager {
	constructor(private readonly apiKeyManager: ApiKeyManager) {}

	async disablePerson(dbContext: DatabaseContext, person: PersonRow, logger: Logger): Promise<PersonDisableAccessResponse> {
		// Retried: the api_key update races the target's own background session tracking and loses with a 40001,
		// which would otherwise leave the person enabled behind an internal error. Nothing here escapes the transaction.
		return await dbContext.transaction(async trx => {
			if (person.disabled_at !== null) {
				return new ResponseError('PERSON_ALREADY_DISABLED', 'Person is already disabled')
			}

			// Deactivate person & invalidate all api keys associated with person identity
			await this.disablePersonAccount(trx, person.id)
			await this.disableIdentityApiKeys(trx, person.identity_id)

			return new ResponseOk(null)
		}, { retry: { logger } })
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
