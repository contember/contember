import { DeleteEvent, DeleteEventResolvers, UpdateEvent, UpdateEventResolvers } from '../../schema'
import { ResolverContext } from '../ResolverContext'
import { oldValuesLoaderFactory } from './OldValuesHelpers'

export class EventOldValuesResolver implements UpdateEventResolvers<ResolverContext>, DeleteEventResolvers<ResolverContext> {
	async oldValues(
		parent: UpdateEvent | DeleteEvent,
		args: unknown,
		context: ResolverContext,
	): Promise<object> {
		return await context.getLoader(oldValuesLoaderFactory)(parent.id)
	}
}
