import { GraphQLResolveInfo } from 'graphql'
import { ResolverContext } from '../ResolverContext'
import { MutationResolver } from '../Resolver'
import { DiffErrorCode, MutationReleaseArgs, ReleaseErrorCode, ReleaseResponse } from '../../schema'
import { createStageQuery, RebaseExecutor, ReleaseExecutor } from '../../model'
import { FetchStageErrors, fetchStages } from '../helpers/StageFetchHelper'

export class ReleaseMutationResolver implements MutationResolver<'release'> {
	constructor(private readonly rebaseExecutor: RebaseExecutor, private readonly releaseExecutor: ReleaseExecutor) {}

	async release(
		parent: any,
		args: MutationReleaseArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo,
	): Promise<ReleaseResponse> {
		return context.db.transaction(async db => {
			const stagesResult = await fetchStages(args.stage, db, context.project)
			if (!stagesResult.ok) {
				return {
					ok: false,
					errors: stagesResult.errors.map(
						it =>
							({
								[FetchStageErrors.missingBase]: ReleaseErrorCode.MissingBase,
								[FetchStageErrors.headNotFound]: ReleaseErrorCode.StageNotFound,
							}[it]),
					),
				}
			}
			const { head, base } = stagesResult

			await this.rebaseExecutor.rebaseAll(db, context.project)

			await this.releaseExecutor.execute(
				db,
				context.project,
				{
					variables: context.variables,
					identity: context.identity,
				},
				base,
				head,
				[...args.events],
			)

			return {
				ok: true,
				errors: [],
			}
		})
	}
}
