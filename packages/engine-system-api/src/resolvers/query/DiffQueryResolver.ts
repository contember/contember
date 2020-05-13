import { GraphQLResolveInfo } from 'graphql'
import { ResolverContext } from '../ResolverContext'
import { QueryResolver } from '../Resolver'
import { DiffErrorCode, DiffFilterRelation, DiffResponse, QueryDiffArgs } from '../../schema'
import { createStageQuery, DiffBuilder, DiffResponseBuilder } from '../../model'

export class DiffQueryResolver implements QueryResolver<'diff'> {
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

			const filter = args.filter ? args.filter.map(it => ({ ...it, relations: it.relations || [] })) : null
			const diff = await this.diffBuilder.build(
				db,
				{
					variables: context.variables,
					identity: context.identity,
				},
				baseStage,
				headStage,
				filter,
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
					events: this.diffResponseBuilder.buildResponse(diff.events),
				},
			}
		})
	}
}
