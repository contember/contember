import {
	MutationResolvers,
	MutationUpdateProjectMemberArgs,
	UpdateProjectMemberErrorCode,
	UpdateProjectMemberResponse,
} from '../../../schema'
import { ResolverContext } from '../../ResolverContext'
import { PermissionActions, ProjectManager, ProjectMemberManager } from '../../../model'
import { createMembershipValidationErrorResult } from '../../membershipUtils'
import { MembershipValidationErrorType, MembershipValidator } from '../../../model/service/MembershipValidator'
import { createMembershipModification } from '../../../model/service/membershipUtils'
import { Membership } from '../../../model/type/Membership'
import { createErrorResponse, createProjectNotFoundResponse } from '../../errorUtils'

export class UpdateProjectMemberMutationResolver implements MutationResolvers {
	constructor(
		private readonly projectMemberManager: ProjectMemberManager,
		private readonly projectManager: ProjectManager,
		private readonly membershipValidator: MembershipValidator,
	) {}

	async updateProjectMember(
		parent: any,
		{ projectSlug, identityId, memberships }: MutationUpdateProjectMemberArgs,
		context: ResolverContext,
	): Promise<UpdateProjectMemberResponse> {
		const project = await this.projectManager.getProjectBySlug(projectSlug)
		const projectScope = await context.permissionContext.createProjectScope(project)
		await context.requireAccess({
			scope: projectScope,
			action: PermissionActions.PROJECT_UPDATE_MEMBER([]),
			message: 'You are not allowed to update project member variables',
		})
		if (!project) {
			return createProjectNotFoundResponse(UpdateProjectMemberErrorCode.ProjectNotFound, projectSlug)
		}
		const visibleMemberships = await this.projectMemberManager.getProjectMemberships(
			{ id: project.id },
			{ id: identityId },
			context.permissionContext.createAccessVerifier(projectScope),
		)
		const membershipPatch = createMembershipModification(visibleMemberships, memberships)

		const aclMemberships: Membership[] = membershipPatch.map(it => ({
			role: it.role,
			variables: it.variables.map(it => ({
				name: it.name,
				values: 'set' in it ? it.set : [...it.remove, ...it.append],
			})),
		}))

		await context.requireAccess({
			scope: projectScope,
			action: PermissionActions.PROJECT_UPDATE_MEMBER(aclMemberships),
			message: 'You are not allowed to update project member variables',
		})

		const validationResult = (await this.membershipValidator.validate(project.slug, memberships)).filter(
			it => it.error !== MembershipValidationErrorType.VARIABLE_EMPTY,
		)
		if (validationResult.length > 0) {
			const errors = createMembershipValidationErrorResult<UpdateProjectMemberErrorCode>(validationResult)
			return {
				ok: false,
				errors: errors,
				error: errors[0],
			}
		}

		const result = await this.projectMemberManager.updateProjectMember(project.id, identityId, membershipPatch)

		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		return {
			ok: true,
			errors: [],
		}
	}
}
