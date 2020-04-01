import { GraphQLResolveInfo } from 'graphql'
import { ResolverContext } from '../ResolverContext'
import { MutationResolver } from '../Resolver'
import { MutationReleaseArgs, ReleaseResponse } from '../../schema'
import { createStageQuery } from '../../model/queries/StageQueryHelper'
import RebaseExecutor from '../../model/events/RebaseExecutor'
import ReleaseExecutor from '../../model/events/ReleaseExecutor'

export default class ReleaseMutationResolver implements MutationResolver<'release'> {
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

			await this.rebaseExecutor.rebaseAll(db)

			await this.releaseExecutor.execute(
				db,
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
