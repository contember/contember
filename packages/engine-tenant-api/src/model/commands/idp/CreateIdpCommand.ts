import { Command } from '../Command.js'
import { InsertBuilder } from '@contember/database'
import { IdentityProviderData } from '../../type/index.js'

export class CreateIdpCommand implements Command<void> {
	constructor(
		private data: IdentityProviderData,
	) {
	}

	async execute({ db, providers }: Command.Args): Promise<void> {
		const { configuration, options: { autoSignUp, exclusive, initReturnsConfig, requireVerifiedEmail, assumeEmailVerified }, slug, type } = this.data
		await InsertBuilder.create()
			.into('identity_provider')
			.values({
				id: providers.uuid(),
				configuration,
				slug,
				type,
				auto_sign_up: autoSignUp,
				exclusive,
				init_returns_config: initReturnsConfig,
				require_verified_email: requireVerifiedEmail,
				assume_email_verified: assumeEmailVerified,
			})
			.execute(db)
	}
}
