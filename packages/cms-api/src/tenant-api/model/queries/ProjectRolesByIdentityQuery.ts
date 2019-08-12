import { DatabaseQuery } from '@contember/database'
import { DatabaseQueryable } from '@contember/database'

class ProjectRolesByIdentityQuery extends DatabaseQuery<ProjectRolesByIdentityQuery.Result> {
	constructor(private readonly projectId: string, private readonly identityId: string) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<ProjectRolesByIdentityQuery.Result> {
		const result = await queryable
			.createSelectBuilder<ProjectRolesByIdentityQuery.Result>()
			.select('roles')
			.from('project_member')
			.where({
				identity_id: this.identityId,
				project_id: this.projectId,
			})
			.getResult()

		const row = this.fetchOneOrNull(result)

		return row ? row : { roles: [] }
	}
}

namespace ProjectRolesByIdentityQuery {
	export type Result = {
		roles: string[]
	}
}

export default ProjectRolesByIdentityQuery
