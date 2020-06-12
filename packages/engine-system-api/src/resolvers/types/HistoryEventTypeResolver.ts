import {
	HistoryDeleteEvent,
	HistoryDeleteEventResolvers,
	HistoryUpdateEvent,
	HistoryUpdateEventResolvers,
} from '../../schema'
import { ResolverContext } from '../ResolverContext'
import { createBatchLoader } from '../../utils/batchQuery'
import { DatabaseContext } from '../../model/database'
import { OldValuesQuery } from '../../model/queries/events'

const oldValuesLoaderFactory = (db: DatabaseContext) =>
	createBatchLoader<string, Record<string, object>, object>(
		async ids => {
			return db.queryHandler.fetch(new OldValuesQuery(ids[ids.length - 1] /* fixme*/, ids))
		},
		(id, items) => items[id],
	)

export class HistoryEventTypeResolver
	implements HistoryUpdateEventResolvers<ResolverContext>, HistoryDeleteEventResolvers<ResolverContext> {
	async oldValues(
		parent: HistoryUpdateEvent | HistoryDeleteEvent,
		args: unknown,
		context: ResolverContext,
	): Promise<object> {
		return await context.getLoader(oldValuesLoaderFactory)(parent.id)
	}
}
