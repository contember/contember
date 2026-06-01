import { MutationResolvers, MutationSetVariablesArgs } from '../../schema/index.js'
import { ActionsContext } from '../ActionsContext.js'
import { VariablesManager } from '../../../model/VariablesManager.js'
import { ActionsAuthorizationActions } from '../../../authorization/index.js'

export class SetVariablesMutationResolver implements MutationResolvers<ActionsContext> {
	constructor(
		private readonly variablesManager: VariablesManager,
	) {
	}

	async setVariables(parent: unknown, { args }: MutationSetVariablesArgs, ctx: ActionsContext) {
		await ctx.requireAccess(ActionsAuthorizationActions.VARIABLES_SET)

		await this.variablesManager.setVariables(ctx.db, args)

		return {
			ok: true,
		}
	}
}
