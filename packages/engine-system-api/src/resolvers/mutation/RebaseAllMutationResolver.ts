import { GraphQLResolveInfo } from 'graphql'
import { ResolverContext } from '../ResolverContext'
import { MutationResolver } from '../Resolver'
import { RebaseAllResponse } from '../../schema'
import Actions from '../../model/authorization/Actions'
import { ProjectScope } from '../../model/authorization/ProjectScope'
import RebaseExecutor from '../../model/events/RebaseExecutor'
import { ProjectConfig } from '../../types'

export default class RebaseAllMutationResolver implements MutationResolver<'rebaseAll'> {
	constructor(private readonly rebaseExecutor: RebaseExecutor) {}
	async rebaseAll(
		parent: any,
		args: any,
		context: ResolverContext,
		info: GraphQLResolveInfo,
	): Promise<RebaseAllResponse> {
		return context.db.transaction(async db => {
			await context.requireAccess(new ProjectScope(context.project), Actions.PROJECT_REBASE_ALL)

			await this.rebaseExecutor.rebaseAll(db, context.project)

			return {
				ok: true,
			}
		})
	}
}
