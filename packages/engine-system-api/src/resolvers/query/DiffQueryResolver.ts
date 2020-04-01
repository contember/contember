import { GraphQLResolveInfo } from 'graphql'
import { ResolverContext } from '../ResolverContext'
import { QueryResolver } from '../Resolver'
import { DiffErrorCode, DiffResponse, QueryDiffArgs } from '../../schema'
import DiffResponseBuilder from '../../model/events/DiffResponseBuilder'
import { createStageQuery } from '../../model/queries/StageQueryHelper'
import DiffBuilder from '../../model/events/DiffBuilder'

export default class DiffQueryResolver implements QueryResolver<'diff'> {
	constructor(private readonly diffResponseBuilder: DiffResponseBuilder, private readonly diffBuilder: DiffBuilder) {}

	async diff(
		parent: any,
		args: QueryDiffArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo,
	): Promise<DiffResponse> {
		return context.db.transaction(async db => {
			const [baseStage, headStage] = await Promise.all([
				db.queryHandler.fetch(createStageQuery(args.baseStage)),
				db.queryHandler.fetch(createStageQuery(args.headStage)),
			])
			if (!baseStage || !headStage) {
				return {
					ok: false,
					errors: [
						!baseStage ? DiffErrorCode.BaseNotFound : null,
						!headStage ? DiffErrorCode.HeadNotFound : null,
					].filter((it): it is DiffErrorCode => !!it),
				}
			}

			const diff = await this.diffBuilder.build(
				db,
				{
					variables: context.variables,
					identity: context.identity,
				},
				baseStage,
				headStage,
			)
			if (!diff.ok) {
				return diff
			}

			return {
				ok: true,
				errors: [],
				result: {
					base: baseStage,
					head: headStage,
					events: this.diffResponseBuilder.buildResponse(diff.events, args.filter || null),
				},
			}
		})
	}
}
