import { MutationResolvers, MutationUpdateProjectMemberArgs, UpdateProjectMemberResponse } from '../../../schema/types'
import ResolverContext from '../../ResolverContext'
import ProjectMemberManager from '../../../model/service/ProjectMemberManager'
import ProjectScope from '../../../model/authorization/ProjectScope'
import Actions from '../../../model/authorization/Actions'

export default class UpdateProjectMemberMutationResolver implements MutationResolvers {
	constructor(private readonly projectMemberManager: ProjectMemberManager) {}

	async updateProjectMember(
		parent: any,
		{ projectId, identityId, variables, roles }: MutationUpdateProjectMemberArgs,
		context: ResolverContext
	): Promise<UpdateProjectMemberResponse> {
		await context.requireAccess({
			scope: new ProjectScope(projectId),
			action: Actions.PROJECT_UPDATE_MEMBER_VARIABLES,
			message: 'You are not allowed to update project member variables',
		})

		const result = await this.projectMemberManager.updateProjectMember(
			projectId,
			identityId,
			roles || undefined,
			variables || undefined
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
