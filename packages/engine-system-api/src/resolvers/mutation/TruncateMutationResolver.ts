import { GraphQLResolveInfo } from 'graphql'
import { ResolverContext } from '../ResolverContext'
import { MutationResolver } from '../Resolver'
import { TruncateResponse } from '../../schema'
import { ProjectTruncateExecutor } from '../../model'

export class TruncateMutationResolver implements MutationResolver<'truncate'> {
	constructor(private readonly projectTruncateExecutor: ProjectTruncateExecutor) {}
	async truncate(
		parent: any,
		args: any,
		context: ResolverContext,
		info: GraphQLResolveInfo,
	): Promise<TruncateResponse> {
		await this.projectTruncateExecutor.truncateProject(context.db, context.project, context.schema)
		return {
			ok: true,
		}
	}
}
