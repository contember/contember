import { Command } from '../Command.js'
import { ConflictActionType, DeleteBuilder, InsertBuilder, QueryBuilder } from '@contember/database'
import { ImplementationException } from '../../../exceptions.js'
import { MembershipInput, MembershipLease } from './types.js'
import { PatchProjectMembershipVariablesCommand } from './variables/index.js'

export class CreateOrUpdateProjectMembershipCommand implements Command<void> {
	constructor(
		private readonly projectId: string,
		private readonly identityId: string,
		private readonly membership: MembershipInput,
		/**
		 * A32 — lease this membership, stamping `now() + duration` and the granting provider on both insert
		 * and conflict-update, so a write is at once a grant and a renewal. Only the IdP claim-mapping apply
		 * passes it.
		 *
		 * Omitted (the default) leaves both columns alone rather than clearing them: every other caller —
		 * the operator add/update-member path above all — then emits exactly the statement it emitted before
		 * leases existed, and a membership nothing leases stays unexpiring.
		 */
		private readonly lease?: MembershipLease,
	) {}

	async execute({ db, bus, providers }: Command.Args): Promise<void> {
		const lease = this.lease
		// `now()` is the DATABASE clock on both sides of the lease — stamped here, compared in the
		// membership queries — so a skewed application clock can neither shorten nor extend a grant.
		const leaseValues: QueryBuilder.Values = lease === undefined
			? {}
			: {
				lease_expires_at: expr => expr.raw('now() + ?::interval', lease.duration),
				identity_provider_id: lease.identityProviderId,
			}
		const result = await InsertBuilder.create()
			.into('project_membership')
			.values({
				id: providers.uuid(),
				project_id: this.projectId,
				identity_id: this.identityId,
				role: this.membership.role,
				...leaseValues,
			})
			// intentionally using update instead of "do nothing" so I can use "returning id"
			.onConflict(ConflictActionType.update, ['project_id', 'identity_id', 'role'], {
				role: this.membership.role,
				...leaseValues,
			})
			.returning('id')
			.execute(db)
		if (result.length !== 1) {
			throw new ImplementationException()
		}
		const membershipId = result[0].id as string
		const variables = await bus.execute(
			new PatchProjectMembershipVariablesCommand(membershipId, this.membership.variables),
		)
		if (Object.values(variables).find(it => it.length === 0)) {
			// todo soft-delete instead
			await DeleteBuilder.create()
				.where({
					id: membershipId,
				})
				.from('project_membership')
				.execute(db)
		}
	}
}
