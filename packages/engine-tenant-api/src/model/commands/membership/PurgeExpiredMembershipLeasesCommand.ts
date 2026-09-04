import { DeleteBuilder, LockModifier, LockType, SelectBuilder } from '@contember/database'
import { Command } from '../Command.js'

/**
 * A32 hygiene — deletes memberships whose IdP lease has lapsed and reports what went, so the caller can
 * audit each removal. Not what makes an expired lease harmless ({@link withUnexpiredLease} already denies
 * it): it removes the residue, a row granting nothing that still occupies its membership unique key.
 */
export class PurgeExpiredMembershipLeasesCommand implements Command<PurgeExpiredMembershipLeasesCommand.Row[]> {
	constructor(private readonly limit: number) {
	}

	async execute({ db }: Command.Args): Promise<PurgeExpiredMembershipLeasesCommand.Row[]> {
		const expired = DeleteBuilder.create()
			.from('project_membership')
			.where(expr =>
				expr.in(
					'id',
					SelectBuilder.create()
						.from('project_membership')
						.select('id')
						.where(it => it.raw('"lease_expires_at" <= now()'))
						.orderBy('lease_expires_at')
						// bounds one run: a mapping edit can lapse many leases at once, and this rides on a request
						.limit(this.limit)
						// a row somebody is already renewing is left to the next run, not queued behind them
						.lock(LockType.forUpdate, LockModifier.skipLocked),
				)
			)
			// repeated here on purpose: after a concurrent renewal postgres re-checks only this outer qualification
			.where(expr => expr.raw('"lease_expires_at" <= now()'))
			.returning('identity_id', 'project_id', 'role', 'identity_provider_id')

		return await SelectBuilder.create<PurgeExpiredMembershipLeasesCommand.Row>()
			.with('expired', expired)
			.select(['expired', 'identity_id'], 'identityId')
			.select(['project', 'slug'], 'project')
			.select(['expired', 'role'], 'role')
			.select(['expired', 'identity_provider_id'], 'identityProviderId')
			.select(['person', 'id'], 'personId')
			.from('expired')
			.join('project', undefined, expr => expr.columnsEq(['project', 'id'], ['expired', 'project_id']))
			// left: a membership can belong to an identity with no person (an API key), which still must go
			.leftJoin('person', undefined, expr => expr.columnsEq(['person', 'identity_id'], ['expired', 'identity_id']))
			.getResult(db)
	}
}

export namespace PurgeExpiredMembershipLeasesCommand {
	export type Row = {
		readonly identityId: string
		readonly personId: string | null
		readonly project: string
		readonly role: string
		readonly identityProviderId: string | null
	}
}
