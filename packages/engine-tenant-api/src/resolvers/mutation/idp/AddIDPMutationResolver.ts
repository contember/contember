import { AddIdpResponse, MutationAddIdpArgs, MutationResolvers } from '../../../schema/index.js'
import { PermissionActions } from '../../../model/index.js'
import { IDPManager } from '../../../model/service/idp/IDPManager.js'
import { createErrorResponse } from '../../errorUtils.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { ResponseOk } from '../../../model/utils/Response.js'
import { IdentityProviderBySlugQuery } from '../../../model/queries/index.js'
import { idpRowToAuditSnapshot } from './audit.js'

export class AddIDPMutationResolver implements MutationResolvers {
	constructor(private readonly idpManager: IDPManager) {
	}

	async addIDP(parent: unknown, args: MutationAddIdpArgs, context: TenantResolverContext): Promise<AddIdpResponse> {
		await context.requireAccess({
			action: PermissionActions.IDP_ADD,
			message: 'You are not allowed to add IDP',
		})
		const result = await this.idpManager.addIDP(context.db, {
			configuration: args.configuration as any,
			slug: args.identityProvider,
			type: args.type,
			options: {
				autoSignUp: args.options?.autoSignUp ?? false,
				exclusive: args.options?.exclusive ?? false,
				initReturnsConfig: args.options?.initReturnsConfig ?? false,
				requireVerifiedEmail: args.options?.requireVerifiedEmail ?? false,
			},
		})
		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		const after = await context.db.queryHandler.fetch(new IdentityProviderBySlugQuery(args.identityProvider))
		await context.logAuthAction({
			type: 'idp_create',
			response: new ResponseOk(null),
			eventData: {
				slug: args.identityProvider,
				before: null,
				after: idpRowToAuditSnapshot(after),
			},
		})

		return { ok: true }
	}
}
