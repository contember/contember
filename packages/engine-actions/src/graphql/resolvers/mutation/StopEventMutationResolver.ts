import { MutationResolvers, MutationRetryEventArgs } from '../../schema'
import { ActionsContext } from '../ActionsContext'
import { ActionsAuthorizationActions } from '../../../authorization'
import { EventsRepository } from '../../../dispatch/EventsRepository'

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
