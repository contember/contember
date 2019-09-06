import { ProjectIdentityRelation, ProjectMembersArgs, ProjectResolvers } from '../../schema'
import { ResolverContext } from '../ResolverContext'
import { ProjectMemberManager } from '../../model/service'
import { PermissionActions, ProjectScope } from '../../model/authorization'
import { Project } from '../../model/type'

export class ProjectTypeResolver implements ProjectResolvers {
	constructor(private readonly projectMemberManager: ProjectMemberManager) {}

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
		return (await this.projectMemberManager.getProjectMembers(parent.id)).map(it => ({
			...it,
			identity: { ...it.identity, projects: [] },
		}))
	}
}
