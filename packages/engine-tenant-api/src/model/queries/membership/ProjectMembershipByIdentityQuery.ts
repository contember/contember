import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'
import { byProjectSlug } from './ProjectSlugSpecification.js'
import { withUnexpiredLease } from './MembershipLeaseSpecification.js'
import { Acl } from '@contember/schema'

/**
 * The identity's memberships in a project, with their variable values — the read every access decision
 * for that project resolves through ({@link ProjectMemberManager.getStoredProjectsMemberships}).
 *
 * A membership whose IdP lease has lapsed is excluded ({@link withUnexpiredLease}), so an expired grant
 * is invisible to every access decision at once: the content/system/actions APIs, the tenant
 * authorization identity, the roles reported for a project member, and the before/after snapshots the
 * membership audits are built from. That last one is deliberate — an audit that reported a grant nobody
 * holds would describe access that does not exist.
 *
 * What a lapsed row does still do is exist. Queries that only ask WHETHER a membership row is there —
 * the project listing, the member listing, the operator add-member conflict check — do not carry this
 * predicate, so until the sweep collects it the row can still put someone in a member list with no roles
 * or answer ALREADY_MEMBER. None of those grant anything; the predicate here is what decides access.
 */
class ProjectMembershipByIdentityQuery extends DatabaseQuery<ProjectMembershipByIdentityQuery.Result> {
	constructor(private readonly project: { id: string } | { slug: string }, private readonly identityId: string[]) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<ProjectMembershipByIdentityQuery.Result> {
		let qb = SelectBuilder.create<ProjectMembershipByIdentityQuery.Row>()
		qb = qb
			.with('memberships', qb =>
				qb
					.select(['project_membership', 'id'])
					.select(['project_membership', 'role'])
					.select(['project_membership', 'identity_id'])
					.where(expr => expr.in('identity_id', this.identityId))
					.from('project_membership')
					.match(qb =>
						'id' in this.project
							? qb.where({
								project_id: this.project.id,
							})
							: qb.match(byProjectSlug(this.project.slug))
					)
					.match(withUnexpiredLease()))
			.with('variables', qb =>
				qb
					.select('membership_id')
					.select(cb => cb.raw("json_agg(json_build_object('name', variable, 'values', value))"), 'variables')
					.from('project_membership_variable')
					.join('memberships', undefined, expr => expr.columnsEq(['project_membership_variable', 'membership_id'], ['memberships', 'id']))
					.groupBy('membership_id'))
			.select('role')
			.select(expr => expr.raw("coalesce(variables, '[]'::json)"), 'variables')
			.select('identity_id', 'identityId')
			.from('memberships')
			.leftJoin('variables', undefined, expr => expr.columnsEq(['memberships', 'id'], ['variables', 'membership_id']))

		return await qb.getResult(db)
	}
}

namespace ProjectMembershipByIdentityQuery {
	export type Row = Acl.Membership & { identityId: string }
	export type Result = readonly Row[]
}

export { ProjectMembershipByIdentityQuery }
