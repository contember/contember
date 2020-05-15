import { GraphQLResolveInfo } from 'graphql'
import { ResolverContext } from '../ResolverContext'
import { MutationResolver } from '../Resolver'
import { RebaseAllResponse } from '../../schema'
import { AuthorizationActions, RebaseExecutor } from '../../model'

export class RebaseAllMutationResolver implements MutationResolver<'rebaseAll'> {
	constructor(private readonly rebaseExecutor: RebaseExecutor) {}
	async rebaseAll(
		parent: any,
		args: any,
		context: ResolverContext,
		info: GraphQLResolveInfo,
	): Promise<RebaseAllResponse> {
		return context.db.transaction(async db => {
			await context.requireAccess(AuthorizationActions.PROJECT_REBASE_ALL)

			await this.rebaseExecutor.rebaseAll(db, context.project)

			return {
				ok: true,
			}
		})
	}
}
