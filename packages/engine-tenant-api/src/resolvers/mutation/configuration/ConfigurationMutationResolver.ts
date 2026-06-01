import { ConfigInput, ConfigureResponse, MutationConfigureArgs, MutationResolvers } from '../../../schema/index.js'
import { ConfigurationManager } from '../../../model/service/ConfigurationManager.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { PermissionActions } from '../../../model/index.js'
import { createErrorResponse } from '../../errorUtils.js'
import { ResponseOk } from '../../../model/utils/Response.js'
import { JSONValue } from '@contember/schema'

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

		await context.logAuthAction({
			type: 'tenant_config_change',
			response: new ResponseOk(null),
			eventData: {
				input: redactConfigInput(config),
			},
		})

		return {
			ok: true,
		}
	}
}

/**
 * Strip secret-bearing fields from a ConfigInput before it lands in the
 * persistent audit trail. The mere fact that captcha.secret was set is
 * useful forensics; the value never is.
 */
const redactConfigInput = (input: ConfigInput): JSONValue => {
	const out: Record<string, JSONValue> = { ...(input as unknown as Record<string, JSONValue>) }
	if (input.captcha) {
		out.captcha = {
			...(input.captcha as unknown as Record<string, JSONValue>),
			secret: input.captcha.secret !== null && input.captcha.secret !== undefined && input.captcha.secret !== ''
				? '***'
				: input.captcha.secret ?? null,
		}
	}
	return out as JSONValue
}
