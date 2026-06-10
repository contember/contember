import {
	MutationRemoveProjectMemberArgs,
	MutationResolvers,
	RemoveProjectMemberErrorCode,
	RemoveProjectMemberResponse,
} from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { PermissionActions, ProjectManager, ProjectMemberManager } from '../../../model/index.js'
import { createErrorResponse, createProjectNotFoundResponse } from '../../errorUtils.js'
import { ProjectMembershipByIdentityQuery } from '../../../model/queries/index.js'
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
		await context.requireAccess({
			project,
			action: PermissionActions.PROJECT_REMOVE_MEMBER([]),
			message: 'You are not allowed to remove a project member',
		})
		if (!project) {
			return createProjectNotFoundResponse('PROJECT_NOT_FOUND', projectSlug)
		}
		const memberships = await this.projectMemberManager.getStoredProjectsMemberships(
			context.db,
			{ id: project.id },
			{ id: identityId },
			context.permissionContext.createAccessVerifier(project),
		)
		await context.requireAccess({
			project,
			action: PermissionActions.PROJECT_REMOVE_MEMBER(memberships),
			message: 'You are not allowed to remove a project member',
		})

		const before = await context.db.queryHandler.fetch(new ProjectMembershipByIdentityQuery({ id: project.id }, [identityId]))
		const result = await this.projectMemberManager.removeProjectMember(context.db, project.id, identityId)

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
