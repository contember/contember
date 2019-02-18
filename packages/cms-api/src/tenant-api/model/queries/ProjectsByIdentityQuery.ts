import KnexQuery from '../../../core/knex/KnexQuery'
import KnexQueryable from '../../../core/knex/KnexQueryable'

class ProjectsByIdentityQuery extends KnexQuery<ProjectsByIdentityQuery.Result> {
	constructor(private readonly identityId: string) {
		super()
	}

	async fetch(queryable: KnexQueryable): Promise<ProjectsByIdentityQuery.Result> {
		return await queryable
			.createQueryBuilder()
			.select('project.id', 'project.name', 'project.slug')
			.from('tenant.project')
			.innerJoin('tenant.project_member', 'project_member.project_id', 'project.id')
			.where('tenant.project_member.identity_id', this.identityId)
	}
}

namespace ProjectsByIdentityQuery {
	export type Result = Array<{
		readonly id: string
		readonly name: string
		readonly slug: string
	}>
}

export default ProjectsByIdentityQuery
