import { AddProjectMemberResponse, MutationAddProjectMemberArgs, MutationResolvers } from '../../../schema'
import { ResolverContext } from '../../ResolverContext'
import { PermissionActions, ProjectMemberManager, ProjectScope } from '../../../'

export class AddProjectMemberMutationResolver implements MutationResolvers {
	constructor(private readonly projectMemberManager: ProjectMemberManager) {}

	async addProjectMember(
		parent: any,
		{ projectId, identityId, roles, variables }: MutationAddProjectMemberArgs,
		context: ResolverContext,
	): Promise<AddProjectMemberResponse> {
		await context.requireAccess({
			scope: new ProjectScope(projectId),
			action: PermissionActions.PROJECT_ADD_MEMBER,
			message: 'You are not allowed to add a project member',
		})

		const result = await this.projectMemberManager.addProjectMember(projectId, identityId, roles, variables || [])

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
