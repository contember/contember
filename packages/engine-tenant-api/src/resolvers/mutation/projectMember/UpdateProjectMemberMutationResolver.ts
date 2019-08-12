import { MutationResolvers, MutationUpdateProjectMemberArgs, UpdateProjectMemberResponse } from '../../../schema'
import { ResolverContext } from '../../ResolverContext'
import { PermissionActions, ProjectMemberManager, ProjectScope } from '../../../'

export class UpdateProjectMemberMutationResolver implements MutationResolvers {
	constructor(private readonly projectMemberManager: ProjectMemberManager) {}

	async updateProjectMember(
		parent: any,
		{ projectId, identityId, variables, roles }: MutationUpdateProjectMemberArgs,
		context: ResolverContext,
	): Promise<UpdateProjectMemberResponse> {
		await context.requireAccess({
			scope: new ProjectScope(projectId),
			action: PermissionActions.PROJECT_UPDATE_MEMBER_VARIABLES,
			message: 'You are not allowed to update project member variables',
		})

		const result = await this.projectMemberManager.updateProjectMember(
			projectId,
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
