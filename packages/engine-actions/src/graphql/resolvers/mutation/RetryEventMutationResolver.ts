import { MutationResolvers, MutationRetryEventArgs } from '../../schema/index.js'
import { ActionsContext } from '../ActionsContext.js'
import { ActionsAuthorizationActions } from '../../../authorization/index.js'
import { EventsRepository } from '../../../dispatch/EventsRepository.js'
import { notify } from '../../../utils/notifyChannel.js'

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
