import { Command } from '../Command'
import { InsertBuilder } from '@contember/database'

export class CreatePersonIdentityProviderIdentifierCommand implements Command<void> {
	constructor(
		private readonly identityProviderId: string,
		private readonly personId: string,
		private readonly externalIdentifier: string,
	) {
	}

	async execute({ db, providers }: Command.Args): Promise<void> {
		const id = providers.uuid()

		await InsertBuilder.create()
			.into('person_identity_provider')
			.values({
				id: id,
				identity_provider_id: this.identityProviderId,
				person_id: this.personId,
				external_identifier: this.externalIdentifier,
			})
			.execute(db)
	}
}
