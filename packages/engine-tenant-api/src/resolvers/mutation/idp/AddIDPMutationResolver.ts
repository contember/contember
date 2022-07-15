import { AddIdpResponse, MutationAddIdpArgs, MutationResolvers } from '../../../schema'
import { PermissionActions } from '../../../model'
import { IDPManager } from '../../../model/service/idp/IDPManager'
import { createErrorResponse } from '../../errorUtils'
import { TenantResolverContext } from '../../TenantResolverContext'

export class AddIDPMutationResolver implements MutationResolvers {
	constructor(private readonly idpManager: IDPManager) {
	}

	async addIDP(parent: unknown, args: MutationAddIdpArgs, context: TenantResolverContext): Promise<AddIdpResponse> {
		await context.requireAccess({
			action: PermissionActions.IDP_ADD,
			message: 'You are not allowed to add IDP',
		})
		const result = await this.idpManager.addIDP(context.db, {
			configuration: args.configuration,
			slug: args.identityProvider,
			type: args.type,
			options: {
				autoSignUp: args.options?.autoSignUp ?? false,
				exclusive: args.options?.exclusive ?? false,
			},
		})
		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		return { ok: true }
	}
}
