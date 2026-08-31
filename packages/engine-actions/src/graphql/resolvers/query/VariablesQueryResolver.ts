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

		return await this.variablesManager.listVariables(ctx.db, ctx.project.slug)
	}
}
