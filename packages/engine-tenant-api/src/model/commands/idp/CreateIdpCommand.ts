import { Command } from '../Command'
import { InsertBuilder } from '@contember/database'
import { IdentityProvider } from '../../type'

export class CreateIdpCommand implements Command<void> {
	constructor(
		private data: IdentityProvider,
	) {
	}

	async execute({ db, providers }: Command.Args): Promise<void> {
		const { configuration, options: { autoSignUp }, slug, type } = this.data
		await InsertBuilder.create()
			.into('identity_provider')
			.values({
				id: providers.uuid(),
				configuration,
				slug,
				type,
				auto_sign_up: autoSignUp,
			})
			.execute(db)
	}
}
