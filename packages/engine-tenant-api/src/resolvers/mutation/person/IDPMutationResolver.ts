import {
	InitSignInIdpResponse,
	MutationInitSignInIdpArgs,
	MutationResolvers,
	MutationSignInIdpArgs,
	SignInIdpResponse,
} from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { IDPSignInManager, PermissionActions } from '../../../model/index.js'
import { createErrorResponse } from '../../errorUtils.js'
import { SignInResponseFactory } from '../../responseHelpers/SignInResponseFactory.js'
import { ResponseOk } from '../../../model/utils/Response.js'

export class IDPMutationResolver implements MutationResolvers {
	constructor(
		private readonly idpSignInManager: IDPSignInManager,
		private readonly signInResponseFactory: SignInResponseFactory,
	) {}

	async initSignInIDP(
		parent: any,
		args: MutationInitSignInIdpArgs,
		context: TenantResolverContext,
	): Promise<InitSignInIdpResponse> {
		await context.requireAccess({
			action: PermissionActions.PERSON_CREATE_IDP_URL,
			message: 'You are not allowed to create a redirect URL for IDP',
		})
		const result = await this.idpSignInManager.initSignInIDP(
			context.db,
			args.identityProvider,
			args.data ?? {
				redirectUrl: args.redirectUrl,
			},
		)
		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}
		return { ok: true, errors: [], result: result.result }
	}

	async signInIDP(parent: any, args: MutationSignInIdpArgs, context: TenantResolverContext): Promise<SignInIdpResponse> {
		await context.requireAccess({
			action: PermissionActions.PERSON_SIGN_IN_IDP,
			message: 'You are not allowed to person IDP sign in',
		})
		const signIn = await this.idpSignInManager.signInIDP(
			context.db,
			args.identityProvider,
			args.data ?? {
				sessionData: args.sessionData,
				url: args.idpResponse?.url,
				redirectUrl: args.redirectUrl,
			},
			args.expiration ?? undefined,
			context.httpInfo,
			args.options?.trustForwardedClientInfo === true && context.trustForwardedInfo,
		)
		await context.logAuthAction({
			type: 'idp_login',
			response: signIn,
		})
		// A09 — audit claim-mapping membership sync separately from the login itself, with a plain
		// `{ before, after }` diff. Emitted only when the mapping actually changed grants on this
		// sign-in (the manager returns null otherwise).
		if (signIn.ok && signIn.result.claimMappingAudit) {
			const audit = signIn.result.claimMappingAudit
			await context.logAuthAction({
				type: 'idp_role_mapped',
				response: new ResponseOk(null),
				personId: signIn.result.person.id,
				// the membership change affects the signing-in person — record it as the target too, so it
				// surfaces in target_person_id audit queries like the other project_membership_* events.
				targetPersonId: signIn.result.person.id,
				identityProviderId: signIn.result.identityProviderId,
				// the audit object IS the event payload ({ before, after, syncPolicy, unmatched }); pass it
				// whole so the shape is single-sourced from ClaimMappingAudit (the refresh path does the same).
				eventData: audit,
			})
		}
		// A09 fail-open marker: the mapping was configured but its evaluation/apply failed and was
		// skipped so sign-in could proceed. Audited (no claim values in the payload) so a broken
		// mapping is visible to the operator instead of silently never applying.
		if (signIn.ok && signIn.result.claimMappingFailed) {
			await context.logAuthAction({
				type: 'idp_role_mapping_failed',
				response: new ResponseOk(null),
				personId: signIn.result.person.id,
				targetPersonId: signIn.result.person.id,
				identityProviderId: signIn.result.identityProviderId,
			})
		}
		if (!signIn.ok) {
			return createErrorResponse(signIn.error, signIn.errorMessage)
		}
		return {
			ok: true,
			errors: [],
			result: {
				...await this.signInResponseFactory.createResponse(signIn.result, context),
				idpResponse: signIn.result.idpResponse,
			},
		}
	}
}
