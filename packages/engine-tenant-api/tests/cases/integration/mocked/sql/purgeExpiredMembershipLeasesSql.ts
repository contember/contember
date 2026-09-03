import { SQL } from '../../../../src/tags.js'
import { ExpectedQuery } from '@contember/database-tester'

/**
 * A32 hygiene sweep — issued after the sign-in transaction commits, and only when the provider that was
 * just used configures a `membershipLease`. It removes memberships the access path already refuses.
 */
export const purgeExpiredMembershipLeasesSql = (args: {
	limit: number
	rows?: { identityId: string; personId: string | null; project: string; role: string }[]
}): ExpectedQuery => ({
	sql: SQL`WITH "expired" AS (
			DELETE FROM "project_membership"
			WHERE "id" IN (
				SELECT "id" FROM "project_membership"
				WHERE "lease_expires_at" <= now()
				ORDER BY "lease_expires_at"
				LIMIT ?
			)
			RETURNING "identity_id", "project_id", "role"
		)
		SELECT "expired"."identity_id" AS "identityId", "project"."slug" AS "project", "expired"."role" AS "role", "person"."id" AS "personId"
		FROM "expired"
		INNER JOIN "project" ON "project"."id" = "expired"."project_id"
		LEFT JOIN "person" ON "person"."identity_id" = "expired"."identity_id"`,
	parameters: [args.limit],
	response: { rows: args.rows ?? [] },
})
