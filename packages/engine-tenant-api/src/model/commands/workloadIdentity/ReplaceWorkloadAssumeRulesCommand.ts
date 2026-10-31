import { DeleteBuilder, InsertBuilder } from '@contember/database'
import { Acl } from '@contember/schema'
import { Command } from '../Command.js'

/** Replaces every envelope rule of a trust; each rule is bound to the exact membership row it was declared on. */
export class ReplaceWorkloadAssumeRulesCommand implements Command<void> {
	constructor(
		private readonly trustId: string,
		private readonly rules: readonly { readonly membershipId: string; readonly rule: Acl.MembershipMatchRule }[],
	) {}

	async execute({ db, providers }: Command.Args): Promise<void> {
		await DeleteBuilder.create()
			.from('workload_identity_assume_rule')
			.where({ trust_id: this.trustId })
			.execute(db)
		for (const { membershipId, rule } of this.rules) {
			await InsertBuilder.create()
				.into('workload_identity_assume_rule')
				.values({
					id: providers.uuid(),
					trust_id: this.trustId,
					membership_id: membershipId,
					rule: JSON.stringify(rule),
				})
				.execute(db)
		}
	}
}
