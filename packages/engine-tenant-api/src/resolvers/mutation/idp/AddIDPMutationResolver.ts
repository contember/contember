import { AddIdpResponse, MutationAddIdpArgs, MutationResolvers } from '../../../schema'
import { PermissionActions } from '../../../model'
import { IDPManager } from '../../../model/service/idp/IDPManager'
import { createErrorResponse } from '../../errorUtils'
import { TenantResolverContext } from '../../TenantResolverContext'
import { ResponseOk } from '../../../model/utils/Response'
import { IdentityProviderBySlugQuery } from '../../../model/queries'
import { idpRowToAuditSnapshot } from './audit'

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
			},
		})
		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		const after = await context.db.queryHandler.fetch(new IdentityProviderBySlugQuery(args.identityProvider))
		await context.logAuthAction({
			type: 'idp_create',
			response: new ResponseOk(null),
			changeDiff: {
				slug: args.identityProvider,
				before: null,
				after: idpRowToAuditSnapshot(after),
			},
		})

		return { ok: true }
	}
}
