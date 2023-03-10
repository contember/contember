import { QueryResolvers } from '../../schema'
import { ActionsContext } from '../ActionsContext'
import { VariablesManager } from '../../../model/VariablesManager'

export class VariablesQueryResolver implements QueryResolvers<ActionsContext> {

	constructor(
		private readonly variablesManager: VariablesManager,
	) {
	}

	async variables(parent: unknown, args: unknown, ctx: ActionsContext) {
		return Object.entries(await this.variablesManager.fetchVariables(ctx.db)).map(([name, value]) => ({
			name,
			value,
		}))
	}
}
