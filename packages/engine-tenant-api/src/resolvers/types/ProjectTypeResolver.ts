import { ProjectIdentityRelation, ProjectMembersArgs, ProjectResolvers } from '../../schema'
import { ResolverContext } from '../ResolverContext'
import { ProjectMemberManager } from '../../model/service'
import { PermissionActions } from '../../model/authorization'
import { Project, ProjectSchemaResolver, RoleVariablesDefinition, VariableDefinition } from '../../model/type'
import { getRoleVariables } from '../../model/utils/schemaUtils'

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

		// todo: filter by args
		return (await this.projectMemberManager.getProjectMembers(parent.id, verifier)).map(it => ({
			...it,
			identity: { ...it.identity, projects: [] },
		}))
	}

	async roles(parent: Project) {
		const schema = await this.projectSchemaResolver.getSchema(parent.slug)
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
