import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'
import { byProjectSlug } from './ProjectSlugSpecification'

class ProjectMembershipByIdentityQuery extends DatabaseQuery<ProjectMembershipByIdentityQuery.Result> {
	constructor(private readonly project: { id: string } | { slug: string }, private readonly identityId: string) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<ProjectMembershipByIdentityQuery.Result> {
		let qb = SelectBuilder.create<ProjectMembershipByIdentityQuery.Row>()
			.with('variables', qb =>
				qb
					.select('membership_id')
					.select(cb => cb.raw("json_agg(json_build_object('name', variable, 'values', value))"), 'variables')
					.from('project_membership_variable')
					.groupBy('membership_id'),
			)
			.select('role')
			.select(expr => expr.raw("coalesce(variables, '[]'::json)"), 'variables')
			.from('project_membership')
			.leftJoin('variables', undefined, expr =>
				expr.columnsEq(['project_membership', 'id'], ['variables', 'membership_id']),
			)
			.where({
				identity_id: this.identityId,
			})
		const qbWithProjectWhere =
			'id' in this.project
				? qb.where({
						project_id: this.project.id,
				  })
				: qb.match(byProjectSlug(this.project.slug))
		return await qbWithProjectWhere.getResult(db)
	}
}

namespace ProjectMembershipByIdentityQuery {
	export type Row = { role: string; variables: readonly { name: string; values: readonly string[] }[] }
	export type Result = readonly Row[]
}

export { ProjectMembershipByIdentityQuery }
