import { logger } from '@contember/logger'
import { DatabaseContext } from '../../utils/index.js'
import { PurgeExpiredMembershipLeasesCommand } from '../../commands/index.js'
import { CreateAuthLogEntryCommand } from '../../commands/authLog/CreateAuthLogEntryCommand.js'

/** Rows removed per sweep. Small enough that a mass lapse cannot stall the sign-in it rides on. */
export const MEMBERSHIP_LEASE_SWEEP_LIMIT = 100

/**
 * A32 hygiene — deletes claim-granted memberships whose lease was never renewed and audits each removal.
 * Opportunistic (the engine has no scheduler), so it must not disturb the sign-in it rides on: it takes its
 * own short transaction rather than the sign-in's, whose row locks it would hold, and swallows its failure.
 */
export class MembershipLeaseSweeper {
	async sweep(dbContext: DatabaseContext, limit: number = MEMBERSHIP_LEASE_SWEEP_LIMIT): Promise<void> {
		try {
			// one transaction: a crash between the delete and its audit would lose the record irrecoverably
			await dbContext.transaction(async db => {
				const expired = await db.commandBus.execute(new PurgeExpiredMembershipLeasesCommand(limit))
				for (const [personId, rows] of groupByPerson(expired)) {
					await db.commandBus.execute(
						new CreateAuthLogEntryCommand({
							type: 'idp_membership_lease_expired',
							personId,
							// the memberships were the person's own — recorded as the target too, so it surfaces in
							// target_person_id queries alongside the other project_membership_* events
							targetPersonId: personId,
							// not a failure: the grant ended exactly as configured
							success: true,
							// the grantor belongs per membership; the row column stays null, the sweep being global
							eventData: {
								memberships: rows.map(it => ({ project: it.project, role: it.role, identityProviderId: it.identityProviderId })),
							},
						}),
					)
				}
				// repeatable read + `for update`: a lease renewed and committed under us aborts with 40001, and
				// replaying is safe — nothing in here has an effect outside the transaction
			}, { retry: { logger } })
		} catch (e) {
			// housekeeping, so never fatal — but a permanently broken sweep must not look like an empty one
			logger.error(e, { message: 'IdP membership lease sweep failed' })
		}
	}
}

/** One entry per person, so the audit reads like the `idp_role_mapped` entry that granted them. */
const groupByPerson = (rows: readonly PurgeExpiredMembershipLeasesCommand.Row[]): Map<string, PurgeExpiredMembershipLeasesCommand.Row[]> => {
	const byPerson = new Map<string, PurgeExpiredMembershipLeasesCommand.Row[]>()
	for (const row of rows) {
		// an identity with no person (an API key) has nothing to audit against, but its row still had to go
		if (row.personId === null) {
			continue
		}
		byPerson.set(row.personId, [...byPerson.get(row.personId) ?? [], row])
	}
	return byPerson
}
