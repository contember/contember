import { AddProjectMemberResponse, MutationAddProjectMemberArgs, MutationResolvers } from '../../schema/types'
import { GraphQLResolveInfo } from 'graphql'
import ResolverContext from '../ResolverContext'
import ProjectMemberManager from '../../model/service/ProjectMemberManager'
import ProjectScope from '../../model/authorization/ProjectScope'
import Actions from '../../model/authorization/Actions'
import { ForbiddenError } from 'apollo-server-koa'

export default class AddProjectMemberMutationResolver implements MutationResolvers {
	constructor(private readonly projectMemberManager: ProjectMemberManager) {}

	async addProjectMember(
		parent: any,
		{ projectId, identityId, roles }: MutationAddProjectMemberArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo
	): Promise<AddProjectMemberResponse> {
		if (!(await context.isAllowed(new ProjectScope(projectId), Actions.PROJECT_ADD_MEMBER))) {
			throw new ForbiddenError('You are not allowed to add a project member')
		}
		const result = await this.projectMemberManager.addProjectMember(projectId, identityId, [...roles])

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
