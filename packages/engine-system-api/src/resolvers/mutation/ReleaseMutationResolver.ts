import { GraphQLResolveInfo } from 'graphql'
import { ResolverContext } from '../ResolverContext'
import { MutationResolver } from '../Resolver'
import { MutationReleaseArgs, ReleaseResponse } from '../../schema'
import { createStageQuery, RebaseExecutor, ReleaseExecutor } from '../../model'

export class ReleaseMutationResolver implements MutationResolver<'release'> {
	constructor(private readonly rebaseExecutor: RebaseExecutor, private readonly releaseExecutor: ReleaseExecutor) {}

	async release(
		parent: any,
		args: MutationReleaseArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo,
	): Promise<ReleaseResponse> {
		return context.db.transaction(async db => {
			const [baseStage, headStage] = await Promise.all([
				db.queryHandler.fetch(createStageQuery(args.baseStage)),
				db.queryHandler.fetch(createStageQuery(args.headStage)),
			])
			if (!baseStage || !headStage) {
				return {
					ok: false,
					errors: [], //todo
				}
			}

			await this.rebaseExecutor.rebaseAll(db, context.project)

			await this.releaseExecutor.execute(
				db,
				context.project,
				{
					variables: context.variables,
					identity: context.identity,
				},
				baseStage,
				headStage,
				[...args.events],
			)

			return {
				ok: true,
				errors: [],
			}
		})
	}
}
