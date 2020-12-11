import {
	HistoryDeleteEvent,
	HistoryDeleteEventResolvers,
	HistoryUpdateEvent,
	HistoryUpdateEventResolvers,
} from '../../schema'
import { ResolverContext } from '../ResolverContext'
import { oldValuesLoaderFactory } from './OldValuesHelpers'

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
