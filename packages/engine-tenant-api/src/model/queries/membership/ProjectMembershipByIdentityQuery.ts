import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'
import { byProjectSlug } from './ProjectSlugSpecification.js'
import { withUnexpiredLease } from './MembershipLeaseSpecification.js'
import { Acl } from '@contember/schema'

/**
 * The ACCESS read: a lapsed IdP lease is excluded ({@link withUnexpiredLease}), so an expired grant is
 * invisible to every access decision and to the audit snapshots built from them. Listings go through
 * {@link ProjectMembershipsForDisplayQuery}, which keeps lapsed rows and marks them inactive.
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

/** One membership as a LISTING shows it. `membership` is nested so a display row cannot reach an access decision by accident. */
export type ProjectMemberMembership = {
	readonly identityId: string
	readonly membership: Acl.Membership
	readonly leaseExpiresAt: Date | null
	readonly active: boolean
}

type ProjectMembershipDisplayRow = {
	readonly role: string
	readonly variables: readonly Acl.MembershipVariable[]
	readonly identityId: string
	readonly leaseExpiresAt: Date | null
	readonly active: boolean
}

/**
 * The display counterpart of {@link ProjectMembershipByIdentityQuery}: the same memberships, but lapsed
 * leases included and carrying their state, so a listing can show an expired grant as inactive instead of
 * dropping it. `active` is decided by the database clock, the same one that stamped the lease.
 */
class ProjectMembershipsForDisplayQuery extends DatabaseQuery<ProjectMembershipsForDisplayQuery.Result> {
	constructor(private readonly project: { id: string } | { slug: string }, private readonly identityId: string[]) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<ProjectMembershipsForDisplayQuery.Result> {
		const rows = await SelectBuilder.create<ProjectMembershipDisplayRow>()
			.with('memberships', qb =>
				qb
					.select(['project_membership', 'id'])
					.select(['project_membership', 'role'])
					.select(['project_membership', 'identity_id'])
					.select(['project_membership', 'lease_expires_at'])
					.where(expr => expr.in('identity_id', this.identityId))
					.from('project_membership')
					.match(qb =>
						'id' in this.project
							? qb.where({
								project_id: this.project.id,
							})
							: qb.match(byProjectSlug(this.project.slug))
					))
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
			.select(['memberships', 'lease_expires_at'], 'leaseExpiresAt')
			.select(expr => expr.raw('("memberships"."lease_expires_at" is null or "memberships"."lease_expires_at" > now())'), 'active')
			.from('memberships')
			.leftJoin('variables', undefined, expr => expr.columnsEq(['memberships', 'id'], ['variables', 'membership_id']))
			.getResult(db)

		return rows.map(it => ({
			identityId: it.identityId,
			membership: { role: it.role, variables: it.variables },
			leaseExpiresAt: it.leaseExpiresAt,
			active: it.active,
		}))
	}
}

namespace ProjectMembershipsForDisplayQuery {
	export type Result = readonly ProjectMemberMembership[]
}

export { ProjectMembershipsForDisplayQuery }
