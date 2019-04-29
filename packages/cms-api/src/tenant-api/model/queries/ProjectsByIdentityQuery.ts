import DbQuery from '../../../core/knex/DbQuery'
import DbQueryable from '../../../core/knex/DbQueryable'
import ConditionBuilder from '../../../core/knex/ConditionBuilder'

class ProjectsByIdentityQuery extends DbQuery<ProjectsByIdentityQuery.Result> {
	constructor(private readonly identityId: string) {
		super()
	}

	async fetch(queryable: DbQueryable): Promise<ProjectsByIdentityQuery.Result> {
		return await queryable
			.createSelectBuilder<ProjectsByIdentityQuery.Row>()
			.select(['project', 'id'])
			.select(['project', 'name'])
			.select(['project', 'slug'])
			.from('project')
			.join('project_member', 'project_member', clause =>
				clause.compareColumns(['project_member', 'project_id'], ConditionBuilder.Operator.eq, ['project', 'id'])
			)
			.where(where => where.compare(['project_member', 'identity_id'], ConditionBuilder.Operator.eq, this.identityId))
			.getResult()
	}
}

namespace ProjectsByIdentityQuery {
	export type Row = {
		readonly id: string
		readonly name: string
		readonly slug: string
	}
	export type Result = Array<Row>
}

export default ProjectsByIdentityQuery
