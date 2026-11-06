import { Maybe, Person, ProjectMembersFilter, QueryPersonByIdArgs, QueryPersonsArgs, QueryResolvers } from '../../schema/index.js'
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
		// The same visibility as `persons`, so an id does not open a person the listing would not show.
		if (person.identity_id !== context.identity.id) {
			const visible = await this.findVisibleIdentityIds(context, { identityId: [person.identity_id] })
			if (visible !== 'all' && !visible.has(person.identity_id)) {
				return null
			}
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

		const visible = await this.findVisibleIdentityIds(context, {})
		if (visible === 'all') {
			const rows = await this.personManager.listPersons(context.db, filter, args.limit, args.offset)
			return rows.map(row => PersonResponseFactory.createPersonResponse(row))
		}
		if (visible.size === 0) {
			return []
		}

		const rows = await this.personManager.listPersons(
			context.db,
			{ ...filter, identityIds: [...visible] },
			args.limit,
			args.offset,
		)
		return rows.map(row => PersonResponseFactory.createPersonResponse(row))
	}

	/**
	 * The identities whose persons the caller may read, narrowed by `filter`: everyone with person:list (unscoped), otherwise
	 * exactly the members `project.members` shows the caller, role filtering included.
	 */
	private async findVisibleIdentityIds(context: TenantResolverContext, filter: ProjectMembersFilter): Promise<'all' | Set<string>> {
		if (await context.isAllowed({ action: PermissionActions.PERSON_LIST })) {
			return 'all'
		}
		const projects = await this.projectManager.getProjectsByIdentity(context.db, context.identity.id, context.permissionContext)
		const visibleIdentityIds = new Set<string>()
		for (const project of projects) {
			const scope = await context.permissionContext.createProjectScope(project)
			const verifier = context.permissionContext.createAccessVerifier(scope)
			if (!(await verifier(PermissionActions.PROJECT_VIEW_MEMBER([])))) {
				continue
			}
			const members = await this.projectMemberManager.getProjectMembers(context.db, project.id, verifier, { filter })
			for (const member of members) {
				visibleIdentityIds.add(member.identity.id)
			}
		}
		return visibleIdentityIds
	}
}
