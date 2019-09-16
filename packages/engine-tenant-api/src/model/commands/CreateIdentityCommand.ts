import { Command } from './Command'
import { InsertBuilder } from '@contember/database'

class CreateIdentityCommand implements Command<string> {
	constructor(private readonly roles: string[]) {}

	public async execute({ db, providers }: Command.Args): Promise<string> {
		const identityId = providers.uuid()
		await InsertBuilder.create()
			.into('identity')
			.values({
				id: identityId,
				parent_id: null,
				roles: JSON.stringify(this.roles),
			})
			.execute(db)

		return identityId
	}
}

export { CreateIdentityCommand }
