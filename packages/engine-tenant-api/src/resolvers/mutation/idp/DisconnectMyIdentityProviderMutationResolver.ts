import { DisconnectIdpResponse, MutationDisconnectMyIdentityProviderArgs, MutationResolvers } from '../../../schema/index.js'
import { PermissionActions, PersonIdentityProviderManager, PersonQuery } from '../../../model/index.js'
import { createErrorResponse } from '../../errorUtils.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { ResponseOk } from '../../../model/utils/Response.js'

export class DisconnectMyIdentityProviderMutationResolver implements Pick<MutationResolvers, 'disconnectMyIdentityProvider'> {
	constructor(
		private readonly personIdentityProviderManager: PersonIdentityProviderManager,
	) {
	}

	async disconnectMyIdentityProvider(
		parent: unknown,
		args: MutationDisconnectMyIdentityProviderArgs,
		context: TenantResolverContext,
	): Promise<DisconnectIdpResponse> {
		await context.requireAccess({
			action: PermissionActions.PERSON_DISCONNECT_MY_IDP,
			message: 'You are not allowed to disconnect your identity provider',
		})

		const person = await context.db.queryHandler.fetch(PersonQuery.byIdentity(context.identity.id))
		if (!person) {
			return createErrorResponse('NOT_FOUND', 'Only a person can disconnect an identity provider.')
		}

		const result = await this.personIdentityProviderManager.disconnectIdentityProvider(context.db, person, args.id)
		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		await context.logAuthAction({
			type: 'idp_disconnect',
			response: new ResponseOk(null),
			personId: person.id,
			eventData: { id: args.id, slug: result.result.slug },
		})

		return { ok: true }
	}
}
