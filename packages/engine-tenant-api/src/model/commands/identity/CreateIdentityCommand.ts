import { Command } from '../Command'
import { InsertBuilder } from '@contember/database'

export class CreateIdentityCommand implements Command<string> {
	constructor(private readonly roles: string[], private readonly description?: string) {}

	public async execute({ db, providers }: Command.Args): Promise<string> {
		const identityId = providers.uuid()
		await InsertBuilder.create()
			.into('identity')
			.values({
				id: identityId,
				parent_id: null,
				roles: JSON.stringify(this.roles),
				description: this.description || null,
				created_at: providers.now(),
			})
			.execute(db)

		return identityId
	}
}
