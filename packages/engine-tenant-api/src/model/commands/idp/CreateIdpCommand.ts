import { Command } from '../Command'
import { InsertBuilder } from '@contember/database'
import { IdentityProvider } from '../../type'

export class CreateIdpCommand implements Command<void> {
	constructor(
		private data: IdentityProvider,
	) {
	}

	async execute({ db, providers }: Command.Args): Promise<void> {
		await InsertBuilder.create()
			.into('identity_provider')
			.values({
				id: providers.uuid(),
				...this.data,
			})
			.execute(db)
	}
}
