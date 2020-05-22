import { GraphQLResolveInfo } from 'graphql'
import { ResolverContext } from '../ResolverContext'
import { QueryResolver } from '../Resolver'
import { HistoryErrorCode, HistoryResponse, QueryHistoryArgs } from '../../schema'
import {
	AuthorizationActions,
	EventResponseBuilder,
	HistoryQuery,
	SchemaVersionBuilder,
	StageBySlugQuery,
} from '../../model'
import { getEntity } from '@contember/schema-utils'

export class HistoryQueryResolver implements QueryResolver<'history'> {
	constructor(
		private readonly eventResponseBuilder: EventResponseBuilder,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
	) {}

	async history(
		parent: any,
		args: QueryHistoryArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo,
	): Promise<HistoryResponse> {
		return context.db.transaction(async db => {
			const stage = await db.queryHandler.fetch(new StageBySlugQuery(args.stage))
			if (!stage) {
				return {
					ok: false,
					errors: [HistoryErrorCode.StageNotFound],
				}
			}
			await context.requireAccess(
				AuthorizationActions.PROJECT_HISTORY_ANY,
				stage.slug,
				'You are not allowed to view a history.',
			)

			const schema = await this.schemaVersionBuilder.buildSchema(db)

			const filter = args.filter
				? args.filter.map(it => ({
						tableName: getEntity(schema.model, it.entity).tableName,
						rowIds: [it.id],
				  }))
				: undefined

			const history = await db.queryHandler.fetch(new HistoryQuery(stage.event_id, filter))

			return {
				ok: true,
				errors: [],
				result: {
					events: await this.eventResponseBuilder.buildResponse(history.map(it => ({ ...it, dependencies: [] }))),
				},
			}
		})
	}
}
