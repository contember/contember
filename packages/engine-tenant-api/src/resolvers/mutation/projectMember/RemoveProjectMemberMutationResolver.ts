import { MutationRemoveProjectMemberArgs, MutationResolvers, RemoveProjectMemberResponse } from '../../../schema'
import { ResolverContext } from '../../ResolverContext'
import { PermissionActions, ProjectMemberManager, ProjectScope } from '../../../'

export class RemoveProjectMemberMutationResolver implements MutationResolvers {
	constructor(private readonly projectMemberManager: ProjectMemberManager) {}

	async removeProjectMember(
		parent: any,
		{ projectId, identityId }: MutationRemoveProjectMemberArgs,
		context: ResolverContext,
	): Promise<RemoveProjectMemberResponse> {
		await context.requireAccess({
			scope: new ProjectScope(projectId),
			action: PermissionActions.PROJECT_ADD_MEMBER,
			message: 'You are not allowed to add a project member',
		})

		const result = await this.projectMemberManager.removeProjectMember(projectId, identityId)

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
