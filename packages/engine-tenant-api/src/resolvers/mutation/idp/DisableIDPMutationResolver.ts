import { DisableIdpResponse, MutationDisableIdpArgs, MutationResolvers } from '../../../schema/index.js'
import { PermissionActions } from '../../../model/index.js'
import { IDPManager } from '../../../model/service/idp/IDPManager.js'
import { createErrorResponse } from '../../errorUtils.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { ResponseOk } from '../../../model/utils/Response.js'

export class DisableIDPMutationResolver implements MutationResolvers {
	constructor(private readonly idpManager: IDPManager) {
	}

	async disableIDP(parent: any, args: MutationDisableIdpArgs, context: TenantResolverContext): Promise<DisableIdpResponse> {
		await context.requireAccess({
			action: PermissionActions.IDP_DISABLE,
			message: 'You are not allowed to disable IDP',
		})
		const result = await this.idpManager.disableIDP(context.db, args.identityProvider)
		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		await context.logAuthAction({
			type: 'idp_disable',
			response: new ResponseOk(null),
			eventData: { slug: args.identityProvider },
		})

		return { ok: true }
	}
}
