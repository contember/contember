import { Command } from '../Command'
import { UpdateBuilder } from '@contember/database'
import { IdentityProviderData } from '../../type'

export class UpdateIdpCommand implements Command<void> {
	constructor(
		private id: string,
		private data: UpdateIdpData,
	) {
	}

	async execute({ db }: Command.Args): Promise<void> {
		const { configuration, options: { autoSignUp, exclusive, initReturnsConfig } = {} } = this.data
		await UpdateBuilder.create()
			.table('identity_provider')
			.values({
				configuration,
				auto_sign_up: autoSignUp,
				exclusive,
				init_returns_config: initReturnsConfig,
			})
			.where({
				id: this.id,
			})
			.execute(db)
	}
}

export type UpdateIdpData = {
	options?: Partial<IdentityProviderData['options']>
	configuration?: IdentityProviderData['configuration']
	type?: string
}
