import { GraphQLResolveInfo } from 'graphql'
import ResolverContext from '../ResolverContext'
import { MutationResolver } from '../Resolver'
import { ReleaseMutationArgs, ReleaseResponse } from '../../schema/types'
import { Acl } from 'cms-common'
import { createStageQuery } from '../../model/queries/StageQueryHelper'

export default class ReleaseMutationResolver implements MutationResolver<'release'> {
	constructor(
		private readonly acl: Acl.Schema
	) {
	}

	async release(
		parent: any,
		args: ReleaseMutationArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo
	): Promise<ReleaseResponse> {
		const [baseStage, headStage] = await Promise.all([
			context.container.queryHandler.fetch(createStageQuery(args.baseStage)),
			context.container.queryHandler.fetch(createStageQuery(args.headStage)),
		])
		if (!baseStage || !headStage) {
			return {
				ok: false,
				errors: [], //todo
			}
		}

		await context.container.releaseExecutor.execute(
			{
				variables: context.variables,
				identity: context.identity,
				acl: this.acl,
			},
			baseStage,
			headStage,
			[...args.events]
		)

		return {
			ok: true,
			errors: [],
		}
	}
}
