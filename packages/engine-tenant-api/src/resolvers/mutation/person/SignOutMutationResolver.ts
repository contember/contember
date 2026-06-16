import { MutationResolvers, MutationSignOutArgs, SignOutResponse } from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { PermissionActions, SignOutManager } from '../../../model/index.js'
import { ResponseOk } from '../../../model/utils/Response.js'
import { createErrorResponse } from '../../errorUtils.js'

export class SignOutMutationResolver implements MutationResolvers {
	constructor(private readonly signOutManager: SignOutManager) {}

	async signOut(parent: any, args: MutationSignOutArgs, context: TenantResolverContext): Promise<SignOutResponse> {
		await context.requireAccess({
			action: PermissionActions.PERSON_SIGN_OUT,
			message: 'You are not allowed to sign out',
		})

		const response = await this.signOutManager.signOut(
			context.db,
			context.identity.id,
			context.apiKeyId,
			args.all ?? false,
		)

		if (!response.ok) {
			return createErrorResponse(response.error, response.errorMessage)
		}

		// Audit at the resolver layer (the manager only returns what happened). Only emit when the
		// session was federated and the IdP actually produced an RP-initiated logout URL — i.e. a
		// real Single Logout was initiated, not a plain local sign-out.
		if (response.result.logoutUrl) {
			await context.logAuthAction({
				type: 'idp_logout_initiated',
				response: new ResponseOk(null),
				identityProviderId: response.result.identityProviderId ?? undefined,
				eventData: { all: args.all ?? false },
			})
		}

		return { ok: true, errors: [], logoutUrl: response.result.logoutUrl }
	}
}
