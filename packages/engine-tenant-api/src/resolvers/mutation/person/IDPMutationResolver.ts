import {
	InitSignInIdpResponse,
	MutationInitSignInIdpArgs,
	MutationResolvers,
	MutationSignInIdpArgs,
	SignInIdpResponse,
} from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { IDPSignInManager, PermissionActions, PermissionContextFactory } from '../../../model/index.js'
import { createResolverContext } from '../../TenantResolverContextFactory.js'
import { IdentityTypeResolver } from '../../types/index.js'
import { createErrorResponse } from '../../errorUtils.js'
import { SignInResponseFactory } from '../../responseHelpers/SignInResponseFactory.js'

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
		const result = await this.idpSignInManager.initSignInIDP(context.db, args.identityProvider, args.redirectUrl)
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
			args.redirectUrl,
			args.idpResponse,
			args.sessionData,
			args.expiration ?? undefined,
		)
		if (!signIn.ok) {
			return createErrorResponse(signIn.error, signIn.errorMessage)
		}
		return {
			ok: true,
			errors: [],
			result: await this.signInResponseFactory.createResponse(signIn.result, context),
		}
	}
}
