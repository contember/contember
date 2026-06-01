import { Config, QueryResolvers } from '../../schema/index.js'
import { ConfigurationQuery, PermissionActions } from '../../model/index.js'
import { TenantResolverContext } from '../TenantResolverContext.js'
import { ConfigurationManager } from '../../model/service/ConfigurationManager.js'

export class ConfigurationQueryResolver implements Pick<QueryResolvers, 'configuration'> {
	constructor(
		private readonly configurationManager: ConfigurationManager,
	) {
	}

	async configuration(parent: unknown, args: unknown, context: TenantResolverContext): Promise<Config> {
		await context.requireAccess({
			action: PermissionActions.CONFIG_VIEW,
			message: 'You are not allowed to view configuration',
		})

		return await context.db.queryHandler.fetch(new ConfigurationQuery(context.db.providers))
	}
}
