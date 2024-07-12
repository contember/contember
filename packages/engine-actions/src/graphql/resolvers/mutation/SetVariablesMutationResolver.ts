import { MutationResolvers, MutationSetVariablesArgs } from '../../schema'
import { ActionsContext } from '../ActionsContext'
import { VariablesManager } from '../../../model/VariablesManager'
import { ActionsAuthorizationActions } from '../../../authorization'

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
