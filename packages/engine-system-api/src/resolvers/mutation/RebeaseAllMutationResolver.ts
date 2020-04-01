import { GraphQLResolveInfo } from 'graphql'
import { ResolverContext } from '../ResolverContext'
import { MutationResolver } from '../Resolver'
import { RebaseAllResponse } from '../../schema'
import Actions from '../../model/authorization/Actions'
import { ProjectScope } from '../../model/authorization/ProjectScope'
import RebaseExecutor from '../../model/events/RebaseExecutor'
import { ProjectConfig } from '../../types'

export default class RebeaseAllMutationResolver implements MutationResolver<'rebaseAll'> {
	constructor(private readonly rebaseExecutor: RebaseExecutor, private readonly project: ProjectConfig) {}
	async rebaseAll(
		parent: any,
		args: any,
		context: ResolverContext,
		info: GraphQLResolveInfo,
	): Promise<RebaseAllResponse> {
		return context.db.transaction(async db => {
			await context.requireAccess(new ProjectScope(this.project), Actions.PROJECT_REBASE_ALL)

			await this.rebaseExecutor.rebaseAll(db)

			return {
				ok: true,
			}
		})
	}
}
