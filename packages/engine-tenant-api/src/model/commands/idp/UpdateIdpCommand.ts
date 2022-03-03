import { Command } from '../Command'
import { UpdateBuilder } from '@contember/database'
import { IdentityProvider } from '../../type'

export class UpdateIdpCommand implements Command<void> {
	constructor(
		private id: string,
		private data: UpdateIdpData,
	) {
	}

	async execute({ db, providers }: Command.Args): Promise<void> {
		const { configuration, options: { autoSignUp } = {} } = this.data
		await UpdateBuilder.create()
			.table('identity_provider')
			.values({
				configuration,
				auto_sign_up: autoSignUp,
			})
			.where({
				id: this.id,
			})
			.execute(db)
	}
}

export type UpdateIdpData = {
	options?: Partial<IdentityProvider['options']>
	configuration?: IdentityProvider['configuration']
}
