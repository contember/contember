import { GraphQLResolveInfo } from 'graphql'
import ResolverContext from '../ResolverContext'
import { QueryResolver } from '../Resolver'
import { DiffErrorCode, DiffQueryArgs, DiffResponse } from '../../schema/types'
import DiffResponseBuilder from '../../model/events/DiffResponseBuilder'
import { Acl } from 'cms-common'
import { createStageQuery } from '../../model/queries/StageQueryHelper'

export default class DiffQueryResolver implements QueryResolver<'diff'> {
	constructor(private readonly diffResponseBuilder: DiffResponseBuilder, private readonly acl: Acl.Schema) {}

	async diff(
		parent: any,
		args: DiffQueryArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo
	): Promise<DiffResponse> {
		const [baseStage, headStage] = await Promise.all([
			context.container.queryHandler.fetch(createStageQuery(args.baseStage)),
			context.container.queryHandler.fetch(createStageQuery(args.headStage)),
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

		const diff = await context.container.diffBuilder.build(
			{
				variables: context.variables,
				identity: context.identity,
				acl: this.acl,
			},
			baseStage,
			headStage
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
				events: this.diffResponseBuilder.buildResponse(diff.events, args.filter || []),
			},
		}
	}
}
