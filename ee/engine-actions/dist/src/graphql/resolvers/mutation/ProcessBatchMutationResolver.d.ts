import { MutationResolvers } from '../../schema'
import { ActionsContext } from '../ActionsContext'
import { EventDispatcher } from '../../../dispatch/EventDispatcher'
export declare class ProcessBatchMutationResolver implements MutationResolvers<ActionsContext> {
	private eventDispatcher
	constructor(eventDispatcher: EventDispatcher)
	processBatch(parent: unknown, args: unknown, ctx: ActionsContext): Promise<{
		ok: boolean
	}>
}
//# sourceMappingURL=ProcessBatchMutationResolver.d.ts.map
