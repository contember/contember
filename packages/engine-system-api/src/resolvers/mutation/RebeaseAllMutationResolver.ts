import { GraphQLResolveInfo } from 'graphql'
import { ResolverContext } from '../ResolverContext'
import { MutationResolver } from '../Resolver'
import { RebaseAllResponse } from '../../schema'
import Actions from '../../model/authorization/Actions'
import { ProjectScope } from '../../model/authorization/ProjectScope'

export default class RebeaseAllMutationResolver implements MutationResolver<'rebaseAll'> {
	async rebaseAll(
		parent: any,
		args: any,
		context: ResolverContext,
		info: GraphQLResolveInfo,
	): Promise<RebaseAllResponse> {
		await context.requireAccess(new ProjectScope(context.container.project), Actions.PROJECT_REBASE_ALL)

		await context.container.rebaseExecutor.rebaseAll()

		return {
			ok: true,
		}
	}
}
