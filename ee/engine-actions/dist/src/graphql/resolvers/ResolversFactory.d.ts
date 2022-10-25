import { Resolvers } from '../schema'
import { EventsQueryResolver } from './query'
import { ProcessBatchMutationResolver } from './mutation'
export declare class ResolversFactory {
	private readonly eventsQueryResolver
	private readonly processBatchMutationResolver
	constructor(eventsQueryResolver: EventsQueryResolver, processBatchMutationResolver: ProcessBatchMutationResolver)
	create(): Resolvers
}
//# sourceMappingURL=ResolversFactory.d.ts.map
