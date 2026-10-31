import { UpdateBuilder } from '@contember/database'
import { Command } from '../Command.js'

/** Sets the trust identity's tenant roles and description to exactly the applied ones. */
export class UpdateWorkloadIdentityCommand implements Command<void> {
	constructor(
		private readonly identityId: string,
		private readonly roles: readonly string[],
		private readonly description: string | null,
	) {}

	async execute({ db }: Command.Args): Promise<void> {
		await UpdateBuilder.create()
			.table('identity')
			.values({
				roles: JSON.stringify(this.roles),
				description: this.description,
			})
			.where({ id: this.identityId })
			.execute(db)
	}
}
