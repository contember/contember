import { EnableIdpResponse, MutationEnableIdpArgs, MutationResolvers } from '../../../schema'
import { GraphQLResolveInfo } from 'graphql'
import { PermissionActions } from '../../../model'
import { IDPManager } from '../../../model/service/idp/IDPManager'
import { createErrorResponse } from '../../errorUtils'
import { TenantResolverContext } from '../../TenantResolverContext'
import { ResponseOk } from '../../../model/utils/Response'

export class EnableIDPMutationResolver implements MutationResolvers {
	constructor(private readonly idpManager: IDPManager) {
	}

	async enableIDP(parent: any, args: MutationEnableIdpArgs, context: TenantResolverContext): Promise<EnableIdpResponse> {
		await context.requireAccess({
			action: PermissionActions.IDP_ENABLE,
			message: 'You are not allowed to enable IDP',
		})
		const result = await this.idpManager.enableIDP(context.db, args.identityProvider)
		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		await context.logAuthAction({
			type: 'idp_enable',
			response: new ResponseOk(null),
			eventData: { slug: args.identityProvider },
		})

		return { ok: true }
	}
}
