import { AuthorizationScope } from '@contember/authorization'
import { GraphQLResolveInfo } from 'graphql'
import ResolverContext from '../ResolverContext'
import { MutationResolver } from '../Resolver'
import { RebaseAllResponse } from '../../schema/types'
import Actions from '../../model/authorization/Actions'

export default class RebeaseAllMutationResolver implements MutationResolver<'rebaseAll'> {
	async rebaseAll(
		parent: any,
		args: any,
		context: ResolverContext,
		info: GraphQLResolveInfo,
	): Promise<RebaseAllResponse> {
		await context.requireAccess(new AuthorizationScope.Global(), Actions.PROJECT_REBASE_ALL)

		await context.container.rebaseExecutor.rebaseAll()

		return {
			ok: true,
		}
	}
}
