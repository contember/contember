import { ProjectIdentityRelation, ProjectMembersArgs, ProjectResolvers } from '../../schema'
import { ResolverContext } from '../ResolverContext'
import { ProjectMemberManager } from '../../model/service'
import { PermissionActions, ProjectScope } from '../../model/authorization'
import { Project, ProjectVariablesResolver } from '../../model/type'

export class ProjectTypeResolver implements ProjectResolvers {
	constructor(
		private readonly projectMemberManager: ProjectMemberManager,
		private readonly projectVariablesResolver: ProjectVariablesResolver,
	) {}

	async members(
		parent: Project,
		args: ProjectMembersArgs,
		context: ResolverContext,
	): Promise<readonly ProjectIdentityRelation[]> {
		if (
			!(await context.isAllowed({ scope: new ProjectScope(parent), action: PermissionActions.PROJECT_VIEW_MEMBERS }))
		) {
			return []
		}

		// todo: filter by args
		return (await this.projectMemberManager.getProjectMembers(parent.id)).map(it => ({
			...it,
			identity: { ...it.identity, projects: [] },
		}))
	}

	async roles(parent: Project) {
		return (await this.projectVariablesResolver(parent.slug)).roles.map(it => ({
			...it,
			variables: it.variables.map(it => ({ ...it, __typename: 'RoleEntityVariableDefinition' })),
		}))
	}
}
