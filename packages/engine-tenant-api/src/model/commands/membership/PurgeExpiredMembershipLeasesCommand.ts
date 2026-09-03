import { Command } from '../Command.js'

/**
 * A32 hygiene — delete project memberships whose IdP lease has lapsed, and report what went, so the
 * caller can audit each removal.
 *
 * This is NOT what makes an expired lease harmless: {@link withUnexpiredLease} already excludes these
 * rows from every access decision, whether or not this ever runs. What it removes is the residue — a row
 * that grants nothing but still occupies its `(project, identity, role)` unique key, and so still reads
 * as "already a member" on the operator add-member path.
 *
 * `limit` bounds one run, because a mapping edit can lapse many leases at once and this runs alongside a
 * user-facing request. Whatever is left over is picked up by the next run and stays inert meanwhile.
 * `person` is joined LEFT: a membership can belong to an identity with no person (an API key), which has
 * nothing to audit against but must still be removed.
 */
export class PurgeExpiredMembershipLeasesCommand implements Command<PurgeExpiredMembershipLeasesCommand.Row[]> {
	constructor(private readonly limit: number) {
	}

	async execute({ db }: Command.Args): Promise<PurgeExpiredMembershipLeasesCommand.Row[]> {
		const result = await db.query<PurgeExpiredMembershipLeasesCommand.Row>(
			// The expiry predicate is repeated on the DELETE itself, not left to the subquery alone. A row
			// picked by the subquery can be renewed by a sign-in that commits while this statement waits on
			// it, and Postgres then re-checks only the OUTER qualification — an id match, which still holds —
			// so a subquery-only predicate deletes the grant that sign-in just renewed. `SKIP LOCKED` on top
			// leaves a row somebody else is already renewing alone: this runs on the sign-in path, and there
			// is nothing to gain by queueing behind a transaction whose whole effect is to push the lease
			// forward.
			`WITH "expired" AS (
				DELETE FROM "project_membership"
				WHERE "id" IN (
					SELECT "id" FROM "project_membership"
					WHERE "lease_expires_at" <= now()
					ORDER BY "lease_expires_at"
					LIMIT ?
					FOR UPDATE SKIP LOCKED
				)
				AND "lease_expires_at" <= now()
				RETURNING "identity_id", "project_id", "role"
			)
			SELECT "expired"."identity_id" AS "identityId", "project"."slug" AS "project", "expired"."role" AS "role", "person"."id" AS "personId"
			FROM "expired"
			INNER JOIN "project" ON "project"."id" = "expired"."project_id"
			LEFT JOIN "person" ON "person"."identity_id" = "expired"."identity_id"`,
			[this.limit],
		)
		return result.rows
	}
}

export namespace PurgeExpiredMembershipLeasesCommand {
	export type Row = {
		readonly identityId: string
		readonly personId: string | null
		readonly project: string
		readonly role: string
	}
}
