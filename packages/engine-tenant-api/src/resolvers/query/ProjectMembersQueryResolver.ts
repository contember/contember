import { Membership, QueryProjectMembershipsArgs, QueryResolvers } from '../../schema'
import { ResolverContext } from '../ResolverContext'
import { ProjectManager, ProjectMemberManager } from '../../model/service'
import { PermissionActions, ProjectScope } from '../../model/authorization'

export class ProjectMembersQueryResolver implements QueryResolvers {
	constructor(
		private readonly projectManager: ProjectManager,
		private readonly projectMemberManager: ProjectMemberManager,
	) {}

	async projectMemberships(
		parent: unknown,
		args: QueryProjectMembershipsArgs,
		context: ResolverContext,
	): Promise<readonly Membership[]> {
		const project = await this.projectManager.getProjectBySlug(args.projectSlug)
		if (
			!project ||
			!(await context.isAllowed({ scope: new ProjectScope(project), action: PermissionActions.PROJECT_VIEW_MEMBERS }))
		) {
			return []
		}

		return await this.projectMemberManager.getProjectMemberships(project.id, { id: args.identityId })
	}
}
