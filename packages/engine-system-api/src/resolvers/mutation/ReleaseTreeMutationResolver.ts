import { GraphQLResolveInfo } from 'graphql'
import { ResolverContext } from '../ResolverContext'
import { MutationResolver } from '../Resolver'
import { MutationReleaseTreeArgs, ReleaseTreeErrorCode, ReleaseTreeResponse } from '../../schema'
import {
	DiffBuilder,
	DiffBuilderErrorCode,
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
				return {
					ok: false,
					errors: stagesResult.errors.map(
						it =>
							({
								[FetchStageErrors.missingBase]: ReleaseTreeErrorCode.MissingBase,
								[FetchStageErrors.headNotFound]: ReleaseTreeErrorCode.StageNotFound,
							}[it]),
					),
				}
			}
			const { head, base } = stagesResult

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
				return {
					ok: false,
					errors: diff.errors.map(
						it =>
							({
								[DiffBuilderErrorCode.notRebased]: ReleaseTreeErrorCode.NotRebased,
							}[it]),
					),
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
				return {
					ok: false,
					errors: result.errors.map(
						it =>
							({
								[ReleaseExecutorErrorCode.forbidden]: ReleaseTreeErrorCode.Forbidden,
							}[it]),
					),
				}
			}

			return {
				ok: true,
				errors: [],
			}
		})
	}
}
