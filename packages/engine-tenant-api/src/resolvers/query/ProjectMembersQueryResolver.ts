import { Membership, QueryProjectMembershipsArgs, QueryResolvers } from '../../schema'
import { ResolverContext } from '../ResolverContext'
import { PermissionActions, ProjectManager, ProjectMemberManager } from '../../model'

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
		const projectScope = await context.permissionContext.createProjectScope(project)
		if (
			!project ||
			!(await context.isAllowed({
				scope: projectScope,
				action: PermissionActions.PROJECT_VIEW_MEMBER([]),
			}))
		) {
			return []
		}
		const verifier = context.permissionContext.createAccessVerifier(projectScope)

		return await this.projectMemberManager.getProjectMemberships({ id: project.id }, { id: args.identityId }, verifier)
	}
}
