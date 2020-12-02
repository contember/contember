import { GraphQLResolveInfo } from 'graphql'
import { ResolverContext } from '../ResolverContext'
import { MutationResolver } from '../Resolver'
import { MutationReleaseTreeArgs, ReleaseTreeErrorCode, ReleaseTreeResponse } from '../../schema'
import {
	AuthorizationActions,
	DiffBuilder,
	DiffBuilderErrorCode,
	DiffBuilderResponse,
	RebaseExecutor,
	ReleaseExecutor,
	ReleaseExecutorErrorCode,
} from '../../model'
import { FetchStageErrors, fetchStages } from '../helpers/StageFetchHelper'

export class ReleaseTreeMutationResolver implements MutationResolver<'releaseTree'> {
	constructor(
		private readonly rebaseExecutor: RebaseExecutor,
		private readonly releaseExecutor: ReleaseExecutor,
		private readonly diffBuilder: DiffBuilder,
	) {}

	async releaseTree(
		parent: any,
		args: MutationReleaseTreeArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo,
	): Promise<ReleaseTreeResponse> {
		return context.db.transaction(async db => {
			const stagesResult = await fetchStages(args.stage, db, context.project)
			if (!stagesResult.ok) {
				const code = {
					[FetchStageErrors.missingBase]: ReleaseTreeErrorCode.MissingBase,
					[FetchStageErrors.headNotFound]: ReleaseTreeErrorCode.StageNotFound,
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
			const filter = args.tree ? args.tree.map(it => ({ ...it, relations: it.relations || [] })) : null
			const diff = await this.diffBuilder.build(
				db,
				{
					variables: context.variables,
					identity: context.identity,
				},
				base,
				head,
				filter,
			)
			if (!diff.ok) {
				const code = {
					[DiffBuilderErrorCode.notRebased]: ReleaseTreeErrorCode.NotRebased,
					[DiffBuilderErrorCode.invalidFilter]: ReleaseTreeErrorCode.InvalidFilter,
				}[diff.error]
				return {
					ok: false,
					errors: [code],
					error: {
						code,
						message: diff.message,
					},
				}
			}

			// todo: avoid unnecessary checks (like fetching events again etc.)
			const result = await this.releaseExecutor.execute(
				db,
				context.project,
				{
					variables: context.variables,
					identity: context.identity,
				},
				base,
				head,
				[...diff.events.map(it => it.id)],
			)
			if (!result.ok) {
				await db.client.connection.rollback()
				const code = {
					[ReleaseExecutorErrorCode.forbidden]: ReleaseTreeErrorCode.Forbidden,
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
