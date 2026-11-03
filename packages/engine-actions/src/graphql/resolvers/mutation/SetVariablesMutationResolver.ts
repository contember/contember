import { MutationResolvers, MutationSetVariablesArgs } from '../../schema/index.js'
import { ActionsContext } from '../ActionsContext.js'
import { VariablesManager } from '../../../model/VariablesManager.js'
import { ActionsAuthorizationActions } from '../../../authorization/index.js'
import { EventsRepository } from '../../../dispatch/EventsRepository.js'
import { notify } from '../../../utils/notifyChannel.js'

export class SetVariablesMutationResolver implements MutationResolvers<ActionsContext> {
	constructor(
		private readonly variablesManager: VariablesManager,
		private readonly eventsRepository: EventsRepository,
	) {
	}

	async setVariables(parent: unknown, { args }: MutationSetVariablesArgs, ctx: ActionsContext) {
		await ctx.requireAccess(ActionsAuthorizationActions.VARIABLES_SET)

		await this.variablesManager.setVariables(ctx.db, args, ctx.project.slug)
		// After the variables are committed, so the worker re-checks held events against the new values.
		if (await this.eventsRepository.resumeHeldForUndefinedVariables(ctx.db.client) > 0) {
			await notify(ctx.db.client, ctx.project.slug)
		}

		return {
			ok: true,
		}
	}
}
