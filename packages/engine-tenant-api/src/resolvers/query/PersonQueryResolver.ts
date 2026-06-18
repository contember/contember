import { Maybe, Person, QueryPersonByIdArgs, QueryPersonsArgs, QueryResolvers } from '../../schema/index.js'
import { TenantResolverContext } from '../TenantResolverContext.js'
import { PermissionActions, PersonManager, ProjectManager, ProjectMemberManager } from '../../model/index.js'
import { PersonResponseFactory } from '../responseHelpers/PersonResponseFactory.js'

export class PersonQueryResolver implements QueryResolvers {
	constructor(
		private readonly personManager: PersonManager,
		private readonly projectManager: ProjectManager,
		private readonly projectMemberManager: ProjectMemberManager,
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

		// Otherwise scope to exactly the members the caller may see — the same set
		// reachable via `project.members`. We resolve visible members per project
		// through `getProjectMembers`, which applies per-membership-role filtering,
		// so a caller whose `tenant.view` rule is restricted to some roles only sees
		// those members (a plain `PROJECT_VIEW_MEMBER([])` gate would leak the whole
		// membership, incl. admins, regardless of role).
		const projects = await this.projectManager.getProjectsByIdentity(context.db, context.identity.id, context.permissionContext)
		const visibleIdentityIds = new Set<string>()
		for (const project of projects) {
			const scope = await context.permissionContext.createProjectScope(project)
			const verifier = context.permissionContext.createAccessVerifier(scope)
			if (!(await verifier(PermissionActions.PROJECT_VIEW_MEMBER([])))) {
				continue
			}
			const members = await this.projectMemberManager.getProjectMembers(context.db, project.id, verifier, { filter: {} })
			for (const member of members) {
				visibleIdentityIds.add(member.identity.id)
			}
		}
		if (visibleIdentityIds.size === 0) {
			return []
		}

		const rows = await this.personManager.listPersons(
			context.db,
			{ ...filter, identityIds: [...visibleIdentityIds] },
			args.limit,
			args.offset,
		)
		return rows.map(row => PersonResponseFactory.createPersonResponse(row))
	}
}
