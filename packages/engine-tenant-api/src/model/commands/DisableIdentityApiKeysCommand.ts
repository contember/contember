import { Command } from './'

class DisableIdentityApiKeysCommand implements Command<void> {
	constructor(private readonly identityId: string) {}

	async execute({ db }: Command.Args): Promise<void> {
		const qb = db
			.updateBuilder()
			.table('api_key')
			.where({
				identity_id: this.identityId,
			})
			.values({ disabled_at: new Date() })

		await qb.execute()
	}
}

export { DisableIdentityApiKeysCommand }
