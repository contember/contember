import { Identity, IdentityProjectRelation, IdentityResolvers, Maybe, Person } from '../../schema'
import { QueryHandler } from '@contember/queryable'
import { DatabaseQueryable } from '@contember/database'
import { PersonRow, ProjectManager } from '../../model'
import { ResolverContext } from '../ResolverContext'
import { ProjectMemberManager } from '../../model/service'
import { indexBy, notEmpty } from '../../utils/array'
import { createBatchLoader } from '../../utils/batchQuery'
import { PersonByIdentityBatchQuery } from '../../model/queries/person/PersonByIdentityBatchQuery'

export class IdentityTypeResolver implements IdentityResolvers {
	private personLoader = createBatchLoader<string, Record<string, PersonRow>, PersonRow>(
		async ids => {
			const persons = await this.queryHandler.fetch(new PersonByIdentityBatchQuery(ids))
			return indexBy(persons, 'identity_id')
		},
		(id, result) => result[id],
	)

	constructor(
		private readonly queryHandler: QueryHandler<DatabaseQueryable>,
		private readonly projectMemberManager: ProjectMemberManager,
		private readonly projectManager: ProjectManager,
	) {}

	async person(parent: Identity): Promise<Maybe<Person>> {
		const person = await this.personLoader(parent.id)
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
		parent: { id: string; projects: readonly IdentityProjectRelation[] },
		{}: any,
		context: ResolverContext,
	): Promise<readonly IdentityProjectRelation[]> {
		if (parent.projects.length > 0) {
			return parent.projects
		}
		const isSelf = parent.id === context.identity.id
		const roles = isSelf ? context.identity.roles : []
		const projects = await this.projectManager.getProjectsByIdentity(parent.id, context.permissionContext)
		return (
			await Promise.all(
				projects.map(
					async (it): Promise<IdentityProjectRelation | null> => {
						const verifier = isSelf
							? undefined
							: context.permissionContext.createAccessVerifier(await context.permissionContext.createProjectScope(it))
						const memberships = await this.projectMemberManager.getProjectMemberships(
							{ id: it.id },
							{ id: parent.id, roles },
							verifier,
						)
						if (memberships.length === 0) {
							return null
						}
						return {
							project: { ...it, members: [], roles: [] },
							memberships: memberships,
						}
					},
				),
			)
		).filter(notEmpty)
	}
}
