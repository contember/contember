import { ProjectIdentityRelation, ProjectMembersArgs, ProjectResolvers } from '../../schema'
import { TenantResolverContext } from '../TenantResolverContext'
import { PermissionActions, Project, ProjectMemberManager, ProjectSchemaResolver } from '../../model'
import { getRoleVariables } from '@contember/schema-utils'
import { Acl } from '@contember/schema'
import { UserInputError } from '@contember/graphql-utils'

export class ProjectTypeResolver implements ProjectResolvers {
	constructor(
		private readonly projectMemberManager: ProjectMemberManager,
		private readonly projectSchemaResolver: ProjectSchemaResolver,
	) {}

	async members(
		parent: Project,
		args: ProjectMembersArgs,
		context: TenantResolverContext,
	): Promise<readonly ProjectIdentityRelation[]> {
		const projectScope = await context.permissionContext.createProjectScope(parent)
		const verifier = context.permissionContext.createAccessVerifier(projectScope)
		if (!(await verifier(PermissionActions.PROJECT_VIEW_MEMBER([])))) {
			return []
		}
		if (args.input?.filter?.email && args.input.filter.memberType === 'API_KEY') {
			throw new UserInputError(`Cannot use email filter for ApiKey member type.`)
		}
		if (args.input?.filter?.personId && args.input.filter.memberType === 'API_KEY') {
			throw new UserInputError(`Cannot use personId  filter for ApiKey member type.`)
		}
		if (args.memberType && args.input) {
			throw new UserInputError(`Cannot use both deprecated memberType parameter and new input parameter`)
		}

		const members = await this.projectMemberManager.getProjectMembers(context.db, parent.id, verifier, args.input ?? { filter: { memberType: args.memberType } })
		return members.map(it => ({
			...it,
			identity: { ...it.identity, projects: [] },
		}))
	}

	async roles(parent: Project, args: unknown, context: TenantResolverContext) {
		const schema = await this.projectSchemaResolver.getSchema(parent.slug)
		if (!schema) {
			return []
		}
		return Object.entries(schema.acl.roles).map(([role, def]) => ({
			name: role,
			variables: Object.entries(getRoleVariables(role, schema.acl)).map(([name, variableDef]) => {
				switch (variableDef.type) {
					case Acl.VariableType.entity:
						return { __typename: 'RoleEntityVariableDefinition' as const, name, entityName: variableDef.entityName }
					case Acl.VariableType.predefined:
						return { __typename: 'RolePredefinedVariableDefinition' as const, name, value: variableDef.value }
					case Acl.VariableType.condition:
						return { __typename: 'RoleConditionVariableDefinition' as const, name }
				}
			}),
		}))
	}
}
