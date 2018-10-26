import KnexQuery from '../../../core/knex/KnexQuery'
import KnexQueryable from '../../../core/knex/KnexQueryable'

class ProjectRolesByIdentityQuery extends KnexQuery<ProjectRolesByIdentityQuery.Result> {
	constructor(private readonly projectId: string, private readonly identityId: string) {
		super()
	}

	async fetch(queryable: KnexQueryable): Promise<ProjectRolesByIdentityQuery.Result> {
		const result = await queryable
			.createQueryBuilder()
			.select('roles')
			.from('tenant.project_member')
			.where('identity_id', this.identityId)
			.where('project_id', this.projectId)

		const row = this.fetchOneOrNull<ProjectRolesByIdentityQuery.Result>(result)

		return row ? row : { roles: [] }
	}
}

namespace ProjectRolesByIdentityQuery {
	export type Result = {
		roles: string[]
	}
}

export default ProjectRolesByIdentityQuery
