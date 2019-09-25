import {
	AddProjectMemberErrorCode,
	AddProjectMemberResponse,
	MutationAddProjectMemberArgs,
	MutationResolvers,
} from '../../../schema'
import { ResolverContext } from '../../ResolverContext'
import { PermissionActions, ProjectManager, ProjectMemberManager, ProjectScope } from '../../../model'

export class AddProjectMemberMutationResolver implements MutationResolvers {
	constructor(
		private readonly projectMemberManager: ProjectMemberManager,
		private readonly projectManager: ProjectManager,
	) {}

	async addProjectMember(
		parent: any,
		{ projectSlug, identityId, memberships }: MutationAddProjectMemberArgs,
		context: ResolverContext,
	): Promise<AddProjectMemberResponse> {
		const project = await this.projectManager.getProjectBySlug(projectSlug)
		await context.requireAccess({
			scope: new ProjectScope(project),
			action: PermissionActions.PROJECT_ADD_MEMBER,
			message: 'You are not allowed to add a project member',
		})
		if (!project) {
			return {
				ok: false,
				errors: [{ code: AddProjectMemberErrorCode.ProjectNotFound }],
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
