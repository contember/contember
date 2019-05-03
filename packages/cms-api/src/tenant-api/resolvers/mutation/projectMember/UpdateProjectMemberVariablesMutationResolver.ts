import { MutationResolvers, MutationUpdateProjectMemberVariablesArgs, UpdateProjectMemberVariablesResponse, } from '../../../schema/types'
import { GraphQLResolveInfo } from 'graphql'
import ResolverContext from '../../ResolverContext'
import ProjectMemberManager from '../../../model/service/ProjectMemberManager'
import ProjectScope from '../../../model/authorization/ProjectScope'
import Actions from '../../../model/authorization/Actions'

export default class UpdateProjectMemberVariablesMutationResolver implements MutationResolvers {
	constructor(private readonly projectMemberManager: ProjectMemberManager) {}

	async updateProjectMemberVariables(
		parent: any,
		{ projectId, identityId, variables }: MutationUpdateProjectMemberVariablesArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo
	): Promise<UpdateProjectMemberVariablesResponse> {
		await context.requireAccess({
			scope: new ProjectScope(projectId),
			action: Actions.PROJECT_UPDATE_MEMBER_VARIABLES,
			message: 'You are not allowed to update project member variables'
		})

		const result = await this.projectMemberManager.updateProjectMemberVariables(projectId, identityId, variables)

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
