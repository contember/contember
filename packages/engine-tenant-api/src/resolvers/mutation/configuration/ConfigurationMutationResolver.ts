import { ConfigureResponse, MutationConfigureArgs, MutationResolvers } from '../../../schema'
import { ConfigurationManager } from '../../../model/service/ConfigurationManager'
import { TenantResolverContext } from '../../TenantResolverContext'
import { PermissionActions } from '../../../model'
import { createErrorResponse } from '../../errorUtils'

export class ConfigurationMutationResolver implements Pick<MutationResolvers, 'configure'> {
	constructor(
		private readonly configurationManager: ConfigurationManager,
	) {
	}

	async configure(parent: any, { config }: MutationConfigureArgs, context: TenantResolverContext): Promise<ConfigureResponse> {
		await context.requireAccess({
			action: PermissionActions.CONFIGURE,
			message: 'You are not allowed to configure',
		})

		const result = await this.configurationManager.updateConfiguration(context.db, config)

		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		return {
			ok: true,
		}
	}
}
