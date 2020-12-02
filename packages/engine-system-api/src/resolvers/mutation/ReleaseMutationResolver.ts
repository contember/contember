import { GraphQLResolveInfo } from 'graphql'
import { ResolverContext } from '../ResolverContext'
import { MutationResolver } from '../Resolver'
import { MutationReleaseArgs, ReleaseErrorCode, ReleaseResponse, ReleaseTreeErrorCode } from '../../schema'
import { AuthorizationActions, RebaseExecutor, ReleaseExecutor, ReleaseExecutorErrorCode } from '../../model'
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
				const code = {
					[FetchStageErrors.missingBase]: ReleaseErrorCode.MissingBase,
					[FetchStageErrors.headNotFound]: ReleaseErrorCode.StageNotFound,
				}[stagesResult.error]
				return {
					ok: false,
					errors: [code],
					error: {
						code,
						message: stagesResult.message,
					},
				}
			}
			const { head, base } = stagesResult

			await context.requireAccess(
				AuthorizationActions.PROJECT_RELEASE_SOME,
				head.slug,
				'You are not allowed to execute a release.',
			)

			await this.rebaseExecutor.rebaseAll(db, context.project)

			const result = await this.releaseExecutor.execute(
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
			if (!result.ok) {
				await db.client.connection.rollback()
				const code = {
					[ReleaseExecutorErrorCode.forbidden]: ReleaseErrorCode.Forbidden,
				}[result.error]
				return {
					ok: false,
					errors: [code],
					error: { code },
				}
			}

			return {
				ok: true,
				errors: [],
			}
		})
	}
}
