import {
	InitSignInIdpResponse,
	MutationInitSignInIdpArgs,
	MutationResolvers,
	MutationSignInIdpArgs,
	SignInIdpResponse,
} from '../../../schema'
import { ResolverContext } from '../../ResolverContext'
import { IDPSignInManager, PermissionActions } from '../../../model'
import { createErrorResponse } from '../../errorUtils'
import { SignInResponseFactory } from '../../responseHelpers/SignInResponseFactory'

export class IDPMutationResolver implements MutationResolvers {
	constructor(
		private readonly idpSignInManager: IDPSignInManager,
		private readonly signInResponseFactory: SignInResponseFactory,
	) {}

	async initSignInIDP(
		parent: any,
		args: MutationInitSignInIdpArgs,
		context: ResolverContext,
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

	async signInIDP(parent: any, args: MutationSignInIdpArgs, context: ResolverContext): Promise<SignInIdpResponse> {
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
