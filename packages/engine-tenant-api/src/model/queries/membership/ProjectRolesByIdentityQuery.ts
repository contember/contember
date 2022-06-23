import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'
import { byProjectSlug } from './ProjectSlugSpecification.js'

class ProjectRolesByIdentityQuery extends DatabaseQuery<ProjectRolesByIdentityQuery.Result> {
	constructor(private readonly project: { id: string } | { slug: string }, private readonly identityId: string) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<ProjectRolesByIdentityQuery.Result> {
		let qb = SelectBuilder.create<{ role: string }>() //
			.select('role')
			.from('project_membership')
			.where({
				identity_id: this.identityId,
			})
		const qbWithProjectWhere =
			'id' in this.project
				? qb.where({
					project_id: this.project.id,
				  })
				: qb.match(byProjectSlug(this.project.slug))
		const result = await qbWithProjectWhere.getResult(db)

		return { roles: result.map(it => it.role) }
	}
}

namespace ProjectRolesByIdentityQuery {
	export type Result = {
		roles: string[]
	}
}

export { ProjectRolesByIdentityQuery }
