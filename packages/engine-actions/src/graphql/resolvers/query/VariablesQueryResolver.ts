import { QueryResolvers } from '../../schema/index.js'
import { ActionsContext } from '../ActionsContext.js'
import { VariablesManager } from '../../../model/VariablesManager.js'
import { ActionsAuthorizationActions } from '../../../authorization/index.js'

export class VariablesQueryResolver implements QueryResolvers<ActionsContext> {
	constructor(
		private readonly variablesManager: VariablesManager,
	) {
	}

	async variables(parent: unknown, args: unknown, ctx: ActionsContext) {
		await ctx.requireAccess(ActionsAuthorizationActions.VARIABLES_VIEW)

		return Object.entries(await this.variablesManager.fetchVariables(ctx.db)).map(([name, value]) => ({
			name,
			value,
		}))
	}
}
