import { DatabaseQuery, DatabaseQueryable } from '@contember/database'
import { byProjectSlug } from './ProjectSlugSpecification'

class ProjectBySlugVariablesByIdentityQuery extends DatabaseQuery<ProjectBySlugVariablesByIdentityQuery.Result> {
	constructor(private readonly projectSlug: string, private readonly identityId: string) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<ProjectBySlugVariablesByIdentityQuery.Result> {
		const result: Array<any> = await queryable
			.createSelectBuilder()
			.select('variable')
			.select('values')
			.from('project_member_variable')
			.where({
				identity_id: this.identityId,
			})
			.match(byProjectSlug(this.projectSlug))
			.getResult()

		return result.reduce<ProjectBySlugVariablesByIdentityQuery.Result>(
			(result, row) => ({ ...result, [row.variable]: row.values }),
			{},
		)
	}
}

namespace ProjectBySlugVariablesByIdentityQuery {
	export type Result = { [name: string]: string[] }
}

export { ProjectBySlugVariablesByIdentityQuery }
