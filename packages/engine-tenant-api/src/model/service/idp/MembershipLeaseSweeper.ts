import { DatabaseContext } from '../../utils/index.js'
import { PurgeExpiredMembershipLeasesCommand } from '../../commands/index.js'
import { CreateAuthLogEntryCommand } from '../../commands/authLog/CreateAuthLogEntryCommand.js'

/** Rows removed per sweep. Small enough that a mass lapse cannot stall the sign-in it rides on. */
export const MEMBERSHIP_LEASE_SWEEP_LIMIT = 100

/**
 * A32 hygiene — removes claim-granted memberships whose lease was never renewed, and records each
 * removal as `idp_membership_lease_expired`.
 *
 * The sweep is not what enforces expiry: {@link withUnexpiredLease} already denies a lapsed grant on
 * every access decision, so the security property holds even if this never runs. Two things do need it:
 * the rows would otherwise accumulate, and an expired row still occupies its membership's unique key, so
 * `addProjectMember` would keep answering ALREADY_MEMBER for access nobody holds.
 *
 * It runs opportunistically, on federated sign-in through an IdP that configures a lease, rather than on
 * a schedule — the engine has no scheduler to hang a reaper on, and inventing one for work that is pure
 * housekeeping would put a new always-on component in the authentication path. The trade is that a
 * deployment where nobody ever signs in again also never sweeps; that deployment's expired grants are
 * still refused, they simply keep their rows.
 *
 * Nothing here may disturb the sign-in it rides on, so it runs OUTSIDE the sign-in transaction — it
 * deletes other people's rows, and holding those locks for the length of an authentication would be a
 * needless contention point — and swallows its own failures.
 *
 * The audit entry deliberately carries no `invokedById` and no `identityProviderId`: nobody acted (the
 * lease simply ran out), and the sweep is global — the sign-in that happened to trigger it is not the
 * provider whose grant lapsed.
 */
export class MembershipLeaseSweeper {
	async sweep(dbContext: DatabaseContext, limit: number = MEMBERSHIP_LEASE_SWEEP_LIMIT): Promise<void> {
		let expired: PurgeExpiredMembershipLeasesCommand.Row[]
		try {
			expired = await dbContext.commandBus.execute(new PurgeExpiredMembershipLeasesCommand(limit))
		} catch {
			// housekeeping — a transient DB error just means the next sweep picks these up
			return
		}
		// One entry per person, listing the memberships they lost, so the audit reads like the
		// `idp_role_mapped` entry that granted them rather than one row per (project, role).
		const byPerson = new Map<string, PurgeExpiredMembershipLeasesCommand.Row[]>()
		for (const row of expired) {
			if (row.personId === null) {
				continue
			}
			const rows = byPerson.get(row.personId) ?? []
			rows.push(row)
			byPerson.set(row.personId, rows)
		}
		for (const [personId, rows] of byPerson) {
			try {
				await dbContext.commandBus.execute(
					new CreateAuthLogEntryCommand({
						type: 'idp_membership_lease_expired',
						personId,
						// the memberships were the person's own — recorded as the target too, so it surfaces in
						// target_person_id queries alongside the other project_membership_* events
						targetPersonId: personId,
						// not a failure: the grant ended exactly as configured
						success: true,
						eventData: { memberships: rows.map(it => ({ project: it.project, role: it.role })) },
					}),
				)
			} catch {
				// best-effort audit — the membership is already gone either way
			}
		}
	}
}
