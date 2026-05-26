import { MutationResolvers, MutationUpdateIdpArgs, UpdateIdpResponse } from '../../../schema'
import { PermissionActions } from '../../../model'
import { IDPManager } from '../../../model/service/idp/IDPManager'
import { createErrorResponse } from '../../errorUtils'
import { TenantResolverContext } from '../../TenantResolverContext'
import { ResponseOk } from '../../../model/utils/Response'
import { IdentityProviderBySlugQuery } from '../../../model/queries'
import { idpRowToAuditSnapshot } from './audit'

export class UpdateIDPMutationResolver implements MutationResolvers {
	constructor(private readonly idpManager: IDPManager) {
	}

	async updateIDP(parent: any, args: MutationUpdateIdpArgs, context: TenantResolverContext): Promise<UpdateIdpResponse> {
		await context.requireAccess({
			action: PermissionActions.IDP_UPDATE,
			message: 'You are not allowed to update IDP',
		})
		const before = await context.db.queryHandler.fetch(new IdentityProviderBySlugQuery(args.identityProvider))
		const result = await this.idpManager.updateIDP(context.db, args.identityProvider, {
			configuration: args.configuration as any,
			type: args.type ?? undefined,
			options: {
				autoSignUp: args.options?.autoSignUp ?? undefined,
				exclusive: args.options?.exclusive ?? undefined,
				initReturnsConfig: args.options?.initReturnsConfig ?? undefined,
				requireVerifiedEmail: args.options?.requireVerifiedEmail ?? undefined,
			},
		}, args.mergeConfiguration ?? false)
		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		const after = await context.db.queryHandler.fetch(new IdentityProviderBySlugQuery(args.identityProvider))
		await context.logAuthAction({
			type: 'idp_update',
			response: new ResponseOk(null),
			eventData: {
				slug: args.identityProvider,
				before: idpRowToAuditSnapshot(before),
				after: idpRowToAuditSnapshot(after),
			},
		})

		return { ok: true }
	}
}
