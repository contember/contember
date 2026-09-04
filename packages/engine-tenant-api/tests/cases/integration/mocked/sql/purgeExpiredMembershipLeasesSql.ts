import { SQL } from '../../../../src/tags.js'
import { ExpectedQuery } from '@contember/database-tester'
import { PurgeExpiredMembershipLeasesCommand } from '../../../../../src/index.js'

/**
 * A32 hygiene sweep — issued in its own transaction after the sign-in one commits, and only when the
 * provider that was just used configures a `membershipLease`. `limit` is inlined rather than bound: it is a
 * code constant, and the query builder writes it straight into the SQL.
 */
export const purgeExpiredMembershipLeasesSql = (args: {
	limit: number
	rows?: PurgeExpiredMembershipLeasesCommand.Row[]
}): ExpectedQuery => ({
	sql: SQL`with "expired" as (delete from "tenant"."project_membership"
			where "id" in (select "id" from "tenant"."project_membership"
				where "lease_expires_at" <= now()
				order by "lease_expires_at" asc
				limit ${String(args.limit)}
				for update skip locked)
			and "lease_expires_at" <= now()
			returning "identity_id", "project_id", "role", "identity_provider_id")
		select "expired"."identity_id" as "identityId", "project"."slug" as "project", "expired"."role" as "role",
			"expired"."identity_provider_id" as "identityProviderId", "person"."id" as "personId"
		from "expired"
		inner join "tenant"."project" on "project"."id" = "expired"."project_id"
		left join "tenant"."person" on "person"."identity_id" = "expired"."identity_id"`,
	parameters: [],
	response: { rows: args.rows ?? [] },
})
