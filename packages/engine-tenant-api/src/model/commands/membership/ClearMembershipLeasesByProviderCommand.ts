import { Command } from '../Command.js'
import { UpdateBuilder } from '@contember/database'

/**
 * Clears the lease on every STILL-RUNNING membership one IdP granted, returning how many were cleared.
 * `identity_provider_id` is kept: the row becomes what a mapping with no `membershipLease` grants — unexpiring, still naming its grantor.
 */
export class ClearMembershipLeasesByProviderCommand implements Command<number> {
	constructor(private readonly identityProviderId: string) {}

	async execute({ db }: Command.Args): Promise<number> {
		// A lapsed lease stays lapsed: that access is already gone, and handing it back would let a config edit
		// restore whoever the sweep had not collected yet — an outcome decided by unrelated sign-in traffic.
		// Not `withUnexpiredLease()`: that read predicate also matches unleased rows, i.e. everything this IdP granted.
		return await UpdateBuilder.create()
			.table('project_membership')
			.values({ lease_expires_at: null })
			.where({ identity_provider_id: this.identityProviderId })
			.where(expr => expr.isNotNull('lease_expires_at'))
			.where(expr => expr.raw('"lease_expires_at" > now()'))
			.execute(db)
	}
}
