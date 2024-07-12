import { MutationResolvers } from '../../schema'
import { ActionsContext } from '../ActionsContext'
import { EventDispatcher } from '../../../dispatch/EventDispatcher'
import { ActionsAuthorizationActions } from '../../../authorization'

export class ProcessBatchMutationResolver implements MutationResolvers<ActionsContext> {
	constructor(
		private eventDispatcher: EventDispatcher,
	) {
	}
	async processBatch(parent: unknown, args: unknown, ctx: ActionsContext) {
		await ctx.requireAccess(ActionsAuthorizationActions.EVENTS_PROCESS)

		await this.eventDispatcher.processBatch(ctx)
		return {
			ok: true,
		}
	}
}
