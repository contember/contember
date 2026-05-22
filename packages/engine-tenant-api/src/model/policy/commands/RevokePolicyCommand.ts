import { Command } from '../../commands/Command'
import { DeleteBuilder } from '@contember/database'

export class RevokePolicyCommand implements Command<{ revoked: boolean }> {
	constructor(
		private readonly identityId: string,
		private readonly policyId: string,
	) {}

	async execute({ db }: Command.Args): Promise<{ revoked: boolean }> {
		const result = await DeleteBuilder.create()
			.from('identity_policy')
			.where({
				identity_id: this.identityId,
				policy_id: this.policyId,
			})
			.execute(db)
		return { revoked: result > 0 }
	}
}
