import { SQL } from '../../../../src/tags.js'
import { ExpectedQuery } from '@contember/database-tester'
import { Acl } from '@contember/schema'

/** A row as the DISPLAY query returns it: an unleased membership carries no expiry and is active. */
type DisplayMembership = Acl.Membership & { leaseExpiresAt?: Date | null; active?: boolean }

/**
 * A32: the display read behind `Project.members`, `Identity.projects[].memberships` and `Query.projectMemberships`.
 * Unlike {@link selectMembershipsSql} it keeps lapsed rows and reports their state, so a listing can show an
 * expired grant as inactive instead of dropping it.
 */
export const selectMembershipsForDisplaySql = (args: {
	identityId: string
	projectId: string
	membershipsResponse: readonly DisplayMembership[]
}): ExpectedQuery => ({
	sql: SQL`
		with "memberships" as (select "project_membership"."id", "project_membership"."role", "project_membership"."identity_id",
		                              "project_membership"."lease_expires_at"
		                       from "tenant"."project_membership"
		                       where "identity_id" in (?) and "project_id" = ?),
			"variables" as (select "membership_id", json_agg(json_build_object('name', variable, 'values', value)) as "variables"
			                from "tenant"."project_membership_variable"
				                     inner join "memberships" on "project_membership_variable"."membership_id" = "memberships"."id"
			                group by "membership_id")
		select "role", coalesce(variables, '[]'::json) as "variables", "identity_id" as "identityId",
			"memberships"."lease_expires_at" as "leaseExpiresAt",
			("memberships"."lease_expires_at" is null or "memberships"."lease_expires_at" > now()) as "active"
		from "memberships"
			     left join "variables" on "memberships"."id" = "variables"."membership_id"`,
	parameters: [args.identityId, args.projectId],
	response: {
		rows: args.membershipsResponse.map(it => ({
			role: it.role,
			variables: it.variables,
			identityId: args.identityId,
			leaseExpiresAt: it.leaseExpiresAt ?? null,
			active: it.active ?? true,
		})),
	},
})
