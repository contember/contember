import {
	AddProjectMemberErrorCode,
	AddProjectMemberResponse,
	MutationAddProjectMemberArgs,
	MutationResolvers,
} from '../../../schema'
import { ResolverContext } from '../../ResolverContext'
import { PermissionActions, ProjectManager, ProjectMemberManager, ProjectScope } from '../../../model'
import { createMembershipValidationErrorResult } from '../../utils'
import { MembershipValidator } from '../../../model/service/MembershipValidator'

export class AddProjectMemberMutationResolver implements MutationResolvers {
	constructor(
		private readonly projectMemberManager: ProjectMemberManager,
		private readonly projectManager: ProjectManager,
		private readonly membershipValidator: MembershipValidator,
	) {}

	async addProjectMember(
		parent: any,
		{ projectSlug, identityId, memberships }: MutationAddProjectMemberArgs,
		context: ResolverContext,
	): Promise<AddProjectMemberResponse> {
		const project = await this.projectManager.getProjectBySlug(projectSlug)
		await context.requireAccess({
			scope: await context.permissionContext.createProjectScope(project),
			action: PermissionActions.PROJECT_ADD_MEMBER(memberships),
			message: 'You are not allowed to add a project member',
		})
		if (!project) {
			return {
				ok: false,
				errors: [{ code: AddProjectMemberErrorCode.ProjectNotFound }],
			}
		}
		const validationResult = await this.membershipValidator.validate(project.slug, memberships)
		if (validationResult.length > 0) {
			return {
				ok: false,
				errors: createMembershipValidationErrorResult(validationResult),
			}
		}

		const result = await this.projectMemberManager.addProjectMember(project.id, identityId, memberships)

		if (!result.ok) {
			return {
				ok: false,
				errors: result.errors.map(errorCode => ({ code: errorCode })),
			}
		}

		return {
			ok: true,
			errors: [],
		}
	}
}
