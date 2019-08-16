import { DatabaseQuery, DatabaseQueryable } from '@contember/database'
import { byProjectSlug } from './ProjectSlugSpecification'

class ProjectRolesByIdentityQuery extends DatabaseQuery<ProjectRolesByIdentityQuery.Result> {
	constructor(private readonly project: { id: string } | { slug: string }, private readonly identityId: string) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<ProjectRolesByIdentityQuery.Result> {
		let qb = queryable
			.createSelectBuilder<ProjectRolesByIdentityQuery.Result>()
			.select('roles')
			.from('project_member')
			.where({
				identity_id: this.identityId,
			})
		const qbWithProjectWhere =
			'id' in this.project
				? qb.where({
						project_id: this.project.id,
				  })
				: qb.match(byProjectSlug(this.project.slug))
		const result = await qbWithProjectWhere.getResult()

		const row = this.fetchOneOrNull(result)

		return row ? row : { roles: [] }
	}
}

namespace ProjectRolesByIdentityQuery {
	export type Result = {
		roles: string[]
	}
}

export { ProjectRolesByIdentityQuery }
