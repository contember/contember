import { DeleteEvent, DeleteEventResolvers, UpdateEvent, UpdateEventResolvers } from '../../schema/index.js'
import { SystemResolverContext } from '../SystemResolverContext.js'
import { oldValuesLoaderFactory } from './OldValuesHelpers.js'

export class EventOldValuesResolver implements UpdateEventResolvers<SystemResolverContext>, DeleteEventResolvers<SystemResolverContext> {
	async oldValues(
		parent: UpdateEvent | DeleteEvent,
		args: unknown,
		context: SystemResolverContext,
	): Promise<object> {
		return await context.getLoader(oldValuesLoaderFactory)(parent.id)
	}
}
