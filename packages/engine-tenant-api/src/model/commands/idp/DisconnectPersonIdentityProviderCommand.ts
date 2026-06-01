import { Command } from '../Command.js'
import { DeleteBuilder } from '@contember/database'

/**
 * Removes a single external IdP connection of a person. The delete is scoped by
 * both the connection id and the person id, so it can never remove a connection
 * that does not belong to the given person.
 */
export class DisconnectPersonIdentityProviderCommand implements Command<number> {
	constructor(
		private readonly personId: string,
		private readonly personIdentityProviderId: string,
	) {
	}

	async execute({ db }: Command.Args): Promise<number> {
		return await DeleteBuilder.create()
			.from('person_identity_provider')
			.where({
				id: this.personIdentityProviderId,
				person_id: this.personId,
			})
			.execute(db)
	}
}
