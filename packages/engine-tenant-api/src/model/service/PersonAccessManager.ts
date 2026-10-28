import { Logger } from '@contember/logger'
import { PersonQuery } from '../queries'
import { DatabaseContext } from '../utils'
import { DisablePersonCommand } from '../commands/person/DisablePersonCommand'
import { ApiKeyManager } from './apiKey'
import { Response, ResponseError, ResponseOk } from '../utils/Response'
import { DisablePersonErrorCode } from '../../schema'

class PersonAccessManager {

	constructor(private readonly apiKeyManager: ApiKeyManager) {}

	async disablePerson(dbContext: DatabaseContext, personId: string, logger: Logger): Promise<PersonDisableAccessResponse> {
		// Retried: the api_key update races the target's own background session tracking and loses with a 40001,
		// which would otherwise leave the person enabled behind an internal error. Nothing here escapes the transaction.
		const result = await dbContext.transaction(async trx => {
			const personRow = await trx.queryHandler.fetch(
				PersonQuery.byId(personId),
			)

			if (personRow === null) {
				return 'PERSON_NOT_FOUND'
			}

			if (personRow.disabled_at !== null) {
				return 'PERSON_ALREADY_DISABLED'
			}

			// Deactivate person & invalidate all api keys associated with person identity
			await this.disablePersonAccount(trx, personRow.id)
			await this.disableIdentityApiKeys(trx, personRow.identity_id)

			return null
		}, { retry: { logger } })

		switch (result) {
			case null:
				return new ResponseOk(null)

			case 'PERSON_ALREADY_DISABLED':
				return new ResponseError(result, 'Person is already disable')

			case 'PERSON_NOT_FOUND':
				return new ResponseError(result, 'Person not found')
		}
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
