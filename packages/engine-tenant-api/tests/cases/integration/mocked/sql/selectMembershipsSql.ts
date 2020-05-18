import { Membership } from '../../../../../src/model/type/Membership'
import { SQL } from '../../../../src/tags'
import { ExpectedQuery } from '@contember/database-tester'

export const selectMembershipsSql = (args: {
	identityId: string
	projectId: string
	membershipsResponse: Membership[]
}): ExpectedQuery => ({
	sql: SQL`
		with "memberships" as (select "project_membership"."id", "project_membership"."role", "project_membership"."identity_id"
		                       from "tenant"."project_membership"
		                       where "identity_id" IN (?) and "project_id" = ?),
			"variables" as (select "membership_id", json_agg(json_build_object('name', variable, 'values', value)) as "variables"
			                from "tenant"."project_membership_variable"
				                     inner join "memberships" on "project_membership_variable"."membership_id" = "memberships"."id"
			                group by "membership_id")
		select "role", coalesce(variables, '[]'::json) as "variables", "identity_id" as "identityId"
		from "memberships"
			     left join "variables" on "memberships"."id" = "variables"."membership_id"`,
	parameters: [args.identityId, args.projectId],
	response: { rows: args.membershipsResponse },
})
