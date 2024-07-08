import { QueryResolvers } from '../../schema'
import { ActionsContext } from '../ActionsContext'
import { VariablesManager } from '../../../model/VariablesManager'
import { ActionsAuthorizationActions } from '../../../authorization'

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
