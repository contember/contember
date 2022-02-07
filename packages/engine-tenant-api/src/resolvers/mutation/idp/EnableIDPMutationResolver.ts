import { EnableIdpResponse, MutationEnableIdpArgs, MutationResolvers } from '../../../schema'
import { GraphQLResolveInfo } from 'graphql'
import { PermissionActions } from '../../../model'
import { IDPManager } from '../../../model/service/idp/IDPManager'
import { createErrorResponse } from '../../errorUtils'
import { TenantResolverContext } from '../../TenantResolverContext'

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

		return { ok: true }
	}
}
