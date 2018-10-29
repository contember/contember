import KnexQuery from '../../../core/knex/KnexQuery'
import KnexQueryable from '../../../core/knex/KnexQueryable'

class ProjectVariablesByIdentityQuery extends KnexQuery<ProjectVariablesByIdentityQuery.Result> {
	constructor(private readonly projectId: string, private readonly identityId: string) {
		super()
	}

	async fetch(queryable: KnexQueryable): Promise<ProjectVariablesByIdentityQuery.Result> {
		const result: Array<any> = await queryable
			.createQueryBuilder()
			.select('variable')
			.select('values')
			.from('tenant.project_member_variable')
			.where('identity_id', this.identityId)
			.where('project_id', this.projectId)

		return result.reduce<ProjectVariablesByIdentityQuery.Result>((result, row) => ({ ...result, [row.variable]: row.values }), {})
	}
}

namespace ProjectVariablesByIdentityQuery {
	export type Result = { [name: string]: string[] }
}

export default ProjectVariablesByIdentityQuery
