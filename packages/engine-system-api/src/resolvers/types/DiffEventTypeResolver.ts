import { DiffDeleteEvent, DiffDeleteEventResolvers, DiffUpdateEvent, DiffUpdateEventResolvers } from '../../schema'
import { ResolverContext } from '../ResolverContext'
import { createBatchLoader } from '../../utils/batchQuery'
import { DatabaseContext } from '../../model/database'
import { OldValuesQuery } from '../../model/queries/events'
import { oldValuesLoaderFactory } from './OldValuesHelpers'

export class DiffEventTypeResolver
	implements DiffUpdateEventResolvers<ResolverContext>, DiffDeleteEventResolvers<ResolverContext> {
	async oldValues(parent: DiffUpdateEvent | DiffDeleteEvent, args: unknown, context: ResolverContext): Promise<object> {
		return await context.getLoader(oldValuesLoaderFactory)(parent.id)
	}
}
