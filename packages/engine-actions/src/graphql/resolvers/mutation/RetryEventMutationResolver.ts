import { MutationResolvers, MutationRetryEventArgs } from '../../schema'
import { ActionsContext } from '../ActionsContext'
import { ActionsAuthorizationActions } from '../../../authorization'
import { EventsRepository } from '../../../dispatch/EventsRepository'
import { notify } from '../../../utils/notifyChannel'

export class RetryEventMutationResolver implements MutationResolvers<ActionsContext> {
	constructor(
		private readonly eventsRepository: EventsRepository,
	) {
	}
	async retryEvent(parent: unknown, args: MutationRetryEventArgs, ctx: ActionsContext) {
		await ctx.requireAccess(ActionsAuthorizationActions.EVENTS_RETRY)

		await this.eventsRepository.requeue(ctx.db.client, [args.id])
		await notify(ctx.db.client, ctx.project.slug)

		return {
			ok: true,
		}
	}
}
