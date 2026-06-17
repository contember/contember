import { Maybe, Person, QueryPersonByIdArgs, QueryPersonsArgs, QueryResolvers } from '../../schema/index.js'
import { TenantResolverContext } from '../TenantResolverContext.js'
import { PermissionActions, PersonManager, ProjectManager } from '../../model/index.js'
import { PersonResponseFactory } from '../responseHelpers/PersonResponseFactory.js'

export class PersonQueryResolver implements QueryResolvers {
	constructor(
		private readonly personManager: PersonManager,
		private readonly projectManager: ProjectManager,
	) {}

	async personById(
		parent: unknown,
		args: QueryPersonByIdArgs,
		context: TenantResolverContext,
	): Promise<Maybe<Person>> {
		const person = await this.personManager.findPersonById(context.db, args.id)
		if (!person || !(await context.isAllowed({ action: PermissionActions.PERSON_VIEW }))) {
			return null
		}

		return await PersonResponseFactory.createPersonResponse(person)
	}

	async persons(
		parent: unknown,
		args: QueryPersonsArgs,
		context: TenantResolverContext,
	): Promise<readonly Person[]> {
		const filter = {
			email: args.filter?.email,
			personId: args.filter?.personId,
			identityId: args.filter?.identityId,
		}

		// SUPER_ADMIN (global wildcard) may list every person.
		if (await context.isAllowed({ action: PermissionActions.PERSON_LIST })) {
			const rows = await this.personManager.listPersons(context.db, filter, args.limit, args.offset)
			return rows.map(row => PersonResponseFactory.createPersonResponse(row))
		}

		// Otherwise scope to persons who are members of a project the caller may view
		// members of — the same persons reachable via project.members, so a PROJECT_ADMIN
		// sees only their projects' members.
		const projects = await this.projectManager.getProjectsByIdentity(context.db, context.identity.id, context.permissionContext)
		const visibleProjectIds: string[] = []
		for (const project of projects) {
			const scope = await context.permissionContext.createProjectScope(project)
			if (await context.permissionContext.isAllowed({ scope, action: PermissionActions.PROJECT_VIEW_MEMBER([]) })) {
				visibleProjectIds.push(project.id)
			}
		}
		if (visibleProjectIds.length === 0) {
			return []
		}

		const rows = await this.personManager.listPersons(
			context.db,
			{ ...filter, memberOfProjectIds: visibleProjectIds },
			args.limit,
			args.offset,
		)
		return rows.map(row => PersonResponseFactory.createPersonResponse(row))
	}
}
