import {
	MutationResolvers,
	MutationUpdateProjectMemberArgs,
	RemoveProjectMemberErrorCode,
	UpdateProjectMemberErrorCode,
	UpdateProjectMemberResponse,
} from '../../../schema'
import { ResolverContext } from '../../ResolverContext'
import { PermissionActions, ProjectManager, ProjectMemberManager, ProjectScope } from '../../../'

export class UpdateProjectMemberMutationResolver implements MutationResolvers {
	constructor(
		private readonly projectMemberManager: ProjectMemberManager,
		private readonly projectManager: ProjectManager,
	) {}

	async updateProjectMember(
		parent: any,
		{ projectSlug, identityId, variables, roles }: MutationUpdateProjectMemberArgs,
		context: ResolverContext,
	): Promise<UpdateProjectMemberResponse> {
		const project = await this.projectManager.getProjectBySlug(projectSlug)
		await context.requireAccess({
			scope: new ProjectScope(project),
			action: PermissionActions.PROJECT_UPDATE_MEMBER_VARIABLES,
			message: 'You are not allowed to update project member variables',
		})
		if (!project) {
			return {
				ok: false,
				errors: [{ code: UpdateProjectMemberErrorCode.ProjectNotFound }],
			}
		}
		const result = await this.projectMemberManager.updateProjectMember(
			project.id,
			identityId,
			roles || undefined,
			variables || undefined,
		)

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
