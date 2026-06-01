import { MutationResolvers } from '../../schema/index.js'
import { ActionsContext } from '../ActionsContext.js'
import { EventDispatcher } from '../../../dispatch/EventDispatcher.js'
import { ActionsAuthorizationActions } from '../../../authorization/index.js'

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
