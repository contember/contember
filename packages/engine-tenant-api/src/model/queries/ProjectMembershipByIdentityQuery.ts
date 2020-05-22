import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'
import { byProjectSlug } from './ProjectSlugSpecification'
import { Membership } from '../type/Membership'

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
							: qb.match(byProjectSlug(this.project.slug)),
					),
			)
			.with('variables', qb =>
				qb
					.select('membership_id')
					.select(cb => cb.raw("json_agg(json_build_object('name', variable, 'values', value))"), 'variables')
					.from('project_membership_variable')
					.join('memberships', undefined, expr =>
						expr.columnsEq(['project_membership_variable', 'membership_id'], ['memberships', 'id']),
					)
					.groupBy('membership_id'),
			)
			.select('role')
			.select(expr => expr.raw("coalesce(variables, '[]'::json)"), 'variables')
			.select('identity_id', 'identityId')
			.from('memberships')
			.leftJoin('variables', undefined, expr => expr.columnsEq(['memberships', 'id'], ['variables', 'membership_id']))

		return await qb.getResult(db)
	}
}

namespace ProjectMembershipByIdentityQuery {
	export type Row = Membership & { identityId: string }
	export type Result = readonly Row[]
}

export { ProjectMembershipByIdentityQuery }
