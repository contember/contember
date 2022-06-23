import {
	MutationRemoveProjectMemberArgs,
	MutationResolvers,
	RemoveProjectMemberErrorCode,
	RemoveProjectMemberResponse,
} from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { PermissionActions, ProjectManager, ProjectMemberManager } from '../../../model/index.js'
import { createErrorResponse, createProjectNotFoundResponse } from '../../errorUtils.js'

export class RemoveProjectMemberMutationResolver implements MutationResolvers {
	constructor(
		private readonly projectMemberManager: ProjectMemberManager,
		private readonly projectManager: ProjectManager,
	) {}

	async removeProjectMember(
		parent: any,
		{ projectSlug, identityId }: MutationRemoveProjectMemberArgs,
		context: TenantResolverContext,
	): Promise<RemoveProjectMemberResponse> {
		const project = await this.projectManager.getProjectBySlug(context.db, projectSlug)
		await context.requireAccess({
			scope: await context.permissionContext.createProjectScope(project),
			action: PermissionActions.PROJECT_REMOVE_MEMBER([]),
			message: 'You are not allowed to remove a project member',
		})
		if (!project) {
			return createProjectNotFoundResponse(RemoveProjectMemberErrorCode.ProjectNotFound, projectSlug)
		}
		const memberships = await this.projectMemberManager.getProjectMemberships(
			context.db,
			{ id: project.id },
			{ id: identityId },
			undefined,
		)
		await context.requireAccess({
			scope: await context.permissionContext.createProjectScope(project),
			action: PermissionActions.PROJECT_REMOVE_MEMBER(memberships),
			message: 'You are not allowed to remove a project member',
		})

		const result = await this.projectMemberManager.removeProjectMember(context.db, project.id, identityId)

		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		return {
			ok: true,
			errors: [],
		}
	}
}
