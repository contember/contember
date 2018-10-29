import { AddProjectMemberResponse, MutationResolvers, UpdateProjectMemberVariablesResponse } from '../../schema/types'
import { GraphQLResolveInfo } from 'graphql'
import ResolverContext from '../ResolverContext'
import ProjectMemberManager from '../../model/service/ProjectMemberManager'
import ProjectScope from '../../model/authorization/ProjectScope'
import Actions from '../../model/authorization/Actions'
import { ForbiddenError } from 'apollo-server-koa'

export default class UpdateProjectMemberVariablesMutationResolver implements MutationResolvers.Resolvers {
	constructor(private readonly projectMemberManager: ProjectMemberManager) {}

	async updateProjectMemberVariables(
		parent: any,
		{ projectId, identityId, variables }: MutationResolvers.UpdateProjectMemberVariablesArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo
	): Promise<UpdateProjectMemberVariablesResponse> {
		if (!(await context.isAllowed(new ProjectScope(projectId), Actions.PROJECT_UPDATE_MEMBER_VARIABLES))) {
			throw new ForbiddenError('You are not allowed to update project member variables')
		}
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
