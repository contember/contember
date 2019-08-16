import {
	AddProjectMemberErrorCode,
	MutationRemoveProjectMemberArgs,
	MutationResolvers,
	RemoveProjectMemberErrorCode,
	RemoveProjectMemberResponse,
} from '../../../schema'
import { ResolverContext } from '../../ResolverContext'
import { PermissionActions, ProjectManager, ProjectMemberManager, ProjectScope } from '../../../'

export class RemoveProjectMemberMutationResolver implements MutationResolvers {
	constructor(
		private readonly projectMemberManager: ProjectMemberManager,
		private readonly projectManager: ProjectManager,
	) {}

	async removeProjectMember(
		parent: any,
		{ projectSlug, identityId }: MutationRemoveProjectMemberArgs,
		context: ResolverContext,
	): Promise<RemoveProjectMemberResponse> {
		const project = await this.projectManager.getProjectBySlug(projectSlug)
		await context.requireAccess({
			scope: new ProjectScope(project),
			action: PermissionActions.PROJECT_ADD_MEMBER,
			message: 'You are not allowed to add a project member',
		})
		if (!project) {
			return {
				ok: false,
				errors: [{ code: RemoveProjectMemberErrorCode.ProjectNotFound }],
			}
		}

		const result = await this.projectMemberManager.removeProjectMember(project.id, identityId)

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
