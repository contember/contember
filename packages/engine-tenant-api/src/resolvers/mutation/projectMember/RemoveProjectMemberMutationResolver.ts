import {
	MutationRemoveProjectMemberArgs,
	MutationResolvers,
	RemoveProjectMemberErrorCode,
	RemoveProjectMemberResponse,
} from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { PermissionActions, ProjectManager, ProjectMemberManager } from '../../../model/index.js'
import { createErrorResponse, createProjectNotFoundResponse } from '../../errorUtils.js'
import { logProjectMembershipChange } from './audit.js'

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
		const projectScope = await context.permissionContext.createProjectScope(project)
		await context.requireAccess({
			scope: projectScope,
			action: PermissionActions.PROJECT_REMOVE_MEMBER([]),
			message: 'You are not allowed to remove a project member',
		})
		if (!project) {
			return createProjectNotFoundResponse('PROJECT_NOT_FOUND', projectSlug)
		}
		// Authorized per stored membership: a manager limited to some roles removes only those and leaves the rest.
		const before = await this.projectMemberManager.getStoredProjectsMemberships(context.db, { id: project.id }, { id: identityId }, undefined)
		const removableRoles: string[] = []
		for (const membership of before) {
			if (await context.isAllowed({ scope: projectScope, action: PermissionActions.PROJECT_REMOVE_MEMBER([membership]) })) {
				removableRoles.push(membership.role)
			}
		}
		if (before.length > 0 && removableRoles.length === 0) {
			await context.requireAccess({
				scope: projectScope,
				action: PermissionActions.PROJECT_REMOVE_MEMBER(before),
				message: 'You are not allowed to remove a project member',
			})
		}
		const result = await this.projectMemberManager.removeProjectMember(
			context.db,
			project.id,
			identityId,
			removableRoles.length === before.length ? undefined : removableRoles,
		)

		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		await logProjectMembershipChange(context, 'project_membership_remove', project.id, identityId, before)

		return {
			ok: true,
			errors: [],
		}
	}
}
