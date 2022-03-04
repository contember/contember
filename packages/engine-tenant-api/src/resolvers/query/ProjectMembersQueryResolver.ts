import { Membership, QueryProjectMembershipsArgs, QueryResolvers } from '../../schema'
import { TenantResolverContext } from '../TenantResolverContext'
import { PermissionActions, ProjectManager, ProjectMemberManager } from '../../model'

export class ProjectMembersQueryResolver implements QueryResolvers {
	constructor(
		private readonly projectManager: ProjectManager,
		private readonly projectMemberManager: ProjectMemberManager,
	) {}

	async projectMemberships(
		parent: unknown,
		args: QueryProjectMembershipsArgs,
		context: TenantResolverContext,
	): Promise<readonly Membership[]> {
		const project = await this.projectManager.getProjectBySlug(context.db, args.projectSlug)
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

		return await this.projectMemberManager.getProjectMemberships(context.db, { id: project.id }, { id: args.identityId }, verifier)
	}
}
