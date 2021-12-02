import { ProjectIdentityRelation, ProjectMembersArgs, ProjectResolvers } from '../../schema'
import { ResolverContext } from '../ResolverContext'
import {
	getRoleVariables,
	PermissionActions,
	Project,
	ProjectMemberManager,
	ProjectSchemaResolver,
	RoleVariablesDefinition,
	VariableDefinition,
} from '../../model'

export class ProjectTypeResolver implements ProjectResolvers {
	constructor(
		private readonly projectMemberManager: ProjectMemberManager,
		private readonly projectSchemaResolver: ProjectSchemaResolver,
	) {}

	async members(
		parent: Project,
		args: ProjectMembersArgs,
		context: ResolverContext,
	): Promise<readonly ProjectIdentityRelation[]> {
		const projectScope = await context.permissionContext.createProjectScope(parent)
		const verifier = context.permissionContext.createAccessVerifier(projectScope)
		if (!(await verifier(PermissionActions.PROJECT_VIEW_MEMBER([])))) {
			return []
		}

		const members = await this.projectMemberManager.getProjectMembers(context.db, parent.id, verifier, args.memberType ?? undefined)
		return members.map(it => ({
			...it,
			identity: { ...it.identity, projects: [] },
		}))
	}

	async roles(parent: Project, args: unknown, context: ResolverContext) {
		const schema = await this.projectSchemaResolver.getSchema(context.projectGroup, parent.slug)
		if (!schema) {
			return []
		}
		const roles = Object.entries(schema.acl.roles).reduce<RoleVariablesDefinition[]>(
			(acc, [role, def]) => [
				...acc,
				{
					name: role,
					variables: Object.entries(getRoleVariables(role, schema.acl)).reduce<VariableDefinition[]>(
						(acc, [name, def]) => [...acc, { name, ...def } as VariableDefinition],
						[],
					),
				},
			],
			[],
		)
		return roles.map(it => ({
			...it,
			variables: it.variables.map(it => ({ ...it, __typename: 'RoleEntityVariableDefinition' })),
		}))
	}
}
