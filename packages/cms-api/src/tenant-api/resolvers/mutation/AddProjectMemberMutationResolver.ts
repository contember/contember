import { AddProjectMemberResponse, MutationResolvers } from '../../schema/types'
import { GraphQLResolveInfo } from 'graphql'
import ResolverContext from '../ResolverContext'
import ProjectMemberManager from '../../model/service/ProjectMemberManager'

export default class AddProjectMemberMutationResolver implements MutationResolvers.Resolvers {
	constructor(private readonly projectMemberManager: ProjectMemberManager) {}

	async addProjectMember(
		parent: any,
		args: MutationResolvers.AddProjectMemberArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo
	): Promise<AddProjectMemberResponse> {
		const result = await this.projectMemberManager.addProjectMember(args.projectId, args.identityId)

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
