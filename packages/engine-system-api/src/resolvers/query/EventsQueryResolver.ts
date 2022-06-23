import { GraphQLResolveInfo } from 'graphql'
import { SystemResolverContext } from '../SystemResolverContext.js'
import { QueryResolver } from '../Resolver.js'
import { EventsOrder, QueryEventsArgs, ResolversTypes } from '../../schema/index.js'
import { AuthorizationActions, EventResponseBuilder, EventsQuery, StageBySlugQuery } from '../../model/index.js'
import { UserInputError } from '@contember/graphql-utils'

export class EventsQueryResolver implements QueryResolver<'events'> {
	constructor(
		private readonly eventResponseBuilder: EventResponseBuilder,
	) {
	}

	async events(
		parent: any,
		{ args }: QueryEventsArgs,
		context: SystemResolverContext,
		info: GraphQLResolveInfo,
	): Promise<ResolversTypes['Event'][]> {
		return context.db.transaction(async db => {
			const stageSlug = args?.stage ?? context.project.stages[0].slug
			const stage = await db.queryHandler.fetch(new StageBySlugQuery(stageSlug))
			if (!stage) {
				throw new UserInputError(`Stage ${stageSlug} not found`)
			}
			await context.requireAccess(
				AuthorizationActions.PROJECT_HISTORY_ANY,
				stage.slug,
				'You are not allowed to view a history.',
			)

			const history = await db.queryHandler.fetch(new EventsQuery(
				args?.filter ?? {},
				args?.order ?? EventsOrder.AppliedAtDesc,
				args?.offset ?? 0,
				Math.min(args?.limit ?? 1000, 10000),
			))

			return await this.eventResponseBuilder.buildResponse(history)
		})
	}
}
