import { MutationResolvers } from '../../schema'
import { ActionsContext } from '../ActionsContext'
import { EventDispatcher } from '../../../dispatch/EventDispatcher'

export class ProcessBatchMutationResolver implements MutationResolvers<ActionsContext> {
	constructor(
		private eventDispatcher: EventDispatcher,
	) {
	}
	async processBatch(parent: unknown, args: unknown, ctx: ActionsContext) {
		await this.eventDispatcher.processBatch(ctx)
		return {
			ok: true,
		}
	}
}
