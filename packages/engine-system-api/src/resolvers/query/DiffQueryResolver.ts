import { GraphQLResolveInfo } from 'graphql'
import { ResolverContext } from '../ResolverContext'
import { QueryResolver } from '../Resolver'
import { DiffErrorCode, DiffResponse, QueryDiffArgs } from '../../schema'
import { DiffBuilder, DiffResponseBuilder } from '../../model'
import { FetchStageErrors, fetchStages } from '../helpers/StageFetchHelper'

export class DiffQueryResolver implements QueryResolver<'diff'> {
	constructor(private readonly diffResponseBuilder: DiffResponseBuilder, private readonly diffBuilder: DiffBuilder) {}

	async diff(
		parent: any,
		args: QueryDiffArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo,
	): Promise<DiffResponse> {
		return context.db.transaction(async db => {
			const stagesResult = await fetchStages(args.stage, db, context.project)
			if (!stagesResult.ok) {
				return {
					ok: false,
					errors: stagesResult.errors.map(
						it =>
							({
								[FetchStageErrors.missingBase]: DiffErrorCode.MissingBase,
								[FetchStageErrors.headNotFound]: DiffErrorCode.StageNotFound,
							}[it]),
					),
				}
			}
			const { head, base } = stagesResult

			const filter = args.filter ? args.filter.map(it => ({ ...it, relations: it.relations || [] })) : null
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
				return diff
			}

			return {
				ok: true,
				errors: [],
				result: {
					base,
					head,
					events: this.diffResponseBuilder.buildResponse(diff.events),
				},
			}
		})
	}
}
