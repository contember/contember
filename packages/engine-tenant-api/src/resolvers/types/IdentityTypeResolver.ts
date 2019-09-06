import { Identity, IdentityProjectRelation, IdentityResolvers, Maybe, Person } from '../../schema'
import { QueryHandler } from '@contember/queryable'
import { DatabaseQueryable } from '@contember/database'
import { PersonQuery, ProjectManager } from '../../model'
import { ResolverContext } from '../ResolverContext'
import { ProjectMemberManager } from '../../model/service'

export class IdentityTypeResolver implements IdentityResolvers {
	constructor(
		private readonly queryHandler: QueryHandler<DatabaseQueryable>,
		private readonly projectMemberManager: ProjectMemberManager,
		private readonly projectManager: ProjectManager,
	) {}

	async person(parent: Identity): Promise<Maybe<Person>> {
		const person = await this.queryHandler.fetch(PersonQuery.byIdentity(parent.id))
		if (!person) {
			return null
		}
		return {
			id: person.id,
			email: person.email,
			identity: parent,
		}
	}

	async projects(
		parent: { id: string },
		{  }: any,
		context: ResolverContext,
	): Promise<readonly IdentityProjectRelation[]> {
		const projects = await this.projectManager.getProjectsByIdentity(parent.id, context.permissionContext)
		return await Promise.all(
			projects.map(
				async (it): Promise<IdentityProjectRelation> => ({
					project: { ...it, members: [], roles: [] },
					memberships: await this.projectMemberManager.getProjectMemberships(it.id, parent.id),
				}),
			),
		)
	}
}
