import { DeleteEvent, DeleteEventResolvers, UpdateEvent, UpdateEventResolvers } from '../../schema'
import { SystemResolverContext } from '../SystemResolverContext'
import { oldValuesLoaderFactory } from './OldValuesHelpers'

export class EventOldValuesResolver implements UpdateEventResolvers<SystemResolverContext>, DeleteEventResolvers<SystemResolverContext> {
	async oldValues(
		parent: UpdateEvent | DeleteEvent,
		args: unknown,
		context: SystemResolverContext,
	): Promise<object> {
		return await context.getLoader(oldValuesLoaderFactory)(parent.id)
	}
}
