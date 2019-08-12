import { Identity, IdentityResolvers, Project } from '../../schema/types'
import { QueryHandler } from '@contember/queryable'
import { DatabaseQueryable } from '@contember/database'
import ProjectsByIdentityQuery from '../../model/queries/ProjectsByIdentityQuery'
import PersonQuery from '../../model/queries/person/PersonQuery'
import ResolverContext from '../ResolverContext'
import ProjectMemberManager from '../../model/service/ProjectMemberManager'

export class IdentityTypeResolver implements IdentityResolvers {
	constructor(
		private readonly queryHandler: QueryHandler<DatabaseQueryable>,
		private readonly projectMemberManager: ProjectMemberManager,
	) {}

	async person(parent: Identity) {
		return await this.queryHandler.fetch(PersonQuery.byIdentity(parent.id))
	}

	async projects(parent: { id: string }, {  }: any, context: ResolverContext) {
		const projects = await this.queryHandler.fetch(new ProjectsByIdentityQuery(context.authorizator, parent.id))
		return await Promise.all(
			projects.map(
				async (it): Promise<Project> => ({
					...it,
					roles: (await this.projectMemberManager.getProjectRoles(it.id, parent.id)).roles,
				}),
			),
		)
	}
}
