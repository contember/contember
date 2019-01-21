import { GraphQLResolveInfo } from 'graphql'
import ResolverContext from '../ResolverContext'
import QueryHandler from '../../../core/query/QueryHandler'
import KnexQueryable from '../../../core/knex/KnexQueryable'
import { QueryResolver } from '../Resolver'
import { DiffErrorCode, DiffQueryArgs, DiffResponse } from '../../schema/types'
import StageByIdQuery from '../../model/queries/StageByIdQuery'
import DiffBuilder from '../../model/events/DiffBuilder'
import DiffResponseBuilder from '../../model/events/DiffResponseBuilder'

export default class DiffQueryResolver implements QueryResolver<'diff'> {
	constructor(
		private readonly queryHandler: QueryHandler<KnexQueryable>,
		private readonly diffBuilder: DiffBuilder,
		private readonly diffResponseBuilder: DiffResponseBuilder
	) {}

	async diff(
		parent: any,
		args: DiffQueryArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo
	): Promise<DiffResponse> {
		const [baseStage, headStage] = await Promise.all([
			this.queryHandler.fetch(new StageByIdQuery(args.baseStage)),
			this.queryHandler.fetch(new StageByIdQuery(args.headStage)),
		])
		if (!baseStage || !headStage) {
			return {
				ok: false,
				errors: [
					!baseStage ? DiffErrorCode.BASE_NOT_FOUND : null,
					!headStage ? DiffErrorCode.HEAD_NOT_FOUND : null,
				].filter((it): it is DiffErrorCode => !!it),
			}
		}

		const diff = await this.diffBuilder.build(baseStage, headStage)
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
	}
}
