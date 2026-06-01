import { MutationResolvers, MutationRetryEventArgs } from '../../schema/index.js'
import { ActionsContext } from '../ActionsContext.js'
import { ActionsAuthorizationActions } from '../../../authorization/index.js'
import { EventsRepository } from '../../../dispatch/EventsRepository.js'

export class StopEventMutationResolver implements MutationResolvers<ActionsContext> {
	constructor(
		private readonly eventsRepository: EventsRepository,
	) {
	}
	async stopEvent(parent: unknown, args: MutationRetryEventArgs, ctx: ActionsContext) {
		await ctx.requireAccess(ActionsAuthorizationActions.EVENTS_STOP)

		await this.eventsRepository.markStopped(ctx.db.client, [args.id])
		return {
			ok: true,
		}
	}
}
