import { Command } from './Command'

class CreateIdentityCommand implements Command<string> {
	constructor(private readonly roles: string[]) {}

	public async execute({ db, providers }: Command.Args): Promise<string> {
		const identityId = providers.uuid()
		await db
			.insertBuilder()
			.into('identity')
			.values({
				id: identityId,
				parent_id: null,
				roles: JSON.stringify(this.roles),
			})
			.execute()

		return identityId
	}
}

export { CreateIdentityCommand }
