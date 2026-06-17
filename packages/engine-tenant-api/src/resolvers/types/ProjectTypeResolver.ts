import { ApiKey, ProjectIdentityRelation, ProjectMembersArgs, ProjectResolvers, ProjectSecretInfo } from '../../schema/index.js'
import { TenantResolverContext } from '../TenantResolverContext.js'
import { PermissionActions, Project, ProjectApiKeysQuery, ProjectMemberManager, ProjectSchemaResolver, SecretsManager } from '../../model/index.js'
import { getRoleVariables } from '@contember/schema-utils'
import { Acl } from '@contember/schema'
import { UserInputError } from '@contember/graphql-utils'
import { ApiKeyResponseFactory } from '../responseHelpers/ApiKeyResponseFactory.js'

export class ProjectTypeResolver implements ProjectResolvers {
	constructor(
		private readonly projectMemberManager: ProjectMemberManager,
		private readonly projectSchemaResolver: ProjectSchemaResolver,
		private readonly secretsManager: SecretsManager,
	) {}

	async apiKeys(
		parent: Omit<Project, 'config'>,
		args: unknown,
		context: TenantResolverContext,
	): Promise<readonly ApiKey[]> {
		const projectScope = await context.permissionContext.createProjectScope(parent)
		if (!(await context.permissionContext.isAllowed({ scope: projectScope, action: PermissionActions.PROJECT_VIEW_MEMBER([]) }))) {
			return []
		}
		const rows = await context.db.queryHandler.fetch(new ProjectApiKeysQuery(parent.id))
		return rows.map(row => ApiKeyResponseFactory.createApiKeyResponse(row))
	}

	async secrets(
		parent: Omit<Project, 'config'>,
		args: unknown,
		context: TenantResolverContext,
	): Promise<readonly ProjectSecretInfo[]> {
		const projectScope = await context.permissionContext.createProjectScope(parent)
		if (!(await context.permissionContext.isAllowed({ scope: projectScope, action: PermissionActions.PROJECT_VIEW_SECRETS }))) {
			return []
		}
		const rows = await this.secretsManager.listSecretKeys(context.db, parent.id)
		return rows.map(it => ({ key: it.key, createdAt: it.created_at, updatedAt: it.updated_at }))
	}

	async members(
		parent: Omit<Project, 'config'>,
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

		const members = await this.projectMemberManager.getProjectMembers(
			context.db,
			parent.id,
			verifier,
			args.input ?? { filter: { memberType: args.memberType } },
		)
		return members.map(it => ({
			...it,
			identity: { ...it.identity, projects: [], sessions: [] },
		}))
	}

	async roles(parent: Omit<Project, 'config'>, args: unknown, context: TenantResolverContext) {
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
