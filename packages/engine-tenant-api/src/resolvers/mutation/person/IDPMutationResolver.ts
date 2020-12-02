import {
	InitSignInIdpResponse,
	MutationInitSignInIdpArgs,
	MutationResolvers,
	MutationSignInIdpArgs,
	SignInIdpResponse,
} from '../../../schema'
import { ResolverContext } from '../../ResolverContext'
import { IDPSignInManager, PermissionActions, PermissionContextFactory } from '../../../model'
import { createResolverContext } from '../../ResolverContextFactory'
import { IdentityTypeResolver } from '../../types'
import { createErrorResponse } from '../../errorUtils'

export class IDPMutationResolver implements MutationResolvers {
	constructor(
		private readonly idpSignInManager: IDPSignInManager,
		private readonly identityTypeResolver: IdentityTypeResolver,
		private readonly permissionContextFactory: PermissionContextFactory,
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
		const result = await this.idpSignInManager.initSignInIDP(args.identityProvider, args.redirectUrl)
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
			args.identityProvider,
			args.redirectUrl,
			args.idpResponse,
			args.sessionData,
			args.expiration ?? undefined,
		)
		if (!signIn.ok) {
			return createErrorResponse(signIn.error, signIn.errorMessage)
		}
		const result = signIn.result
		const identityId = result.person.identity_id
		const permissionContext = this.permissionContextFactory.create({ id: identityId, roles: result.person.roles })
		const projects = await this.identityTypeResolver.projects(
			{ id: identityId, projects: [] },
			{},
			createResolverContext(permissionContext, context.apiKeyId),
		)
		return {
			ok: true,
			errors: [],
			result: {
				token: result.token,
				person: {
					id: result.person.id,
					email: result.person.email,
					identity: {
						id: identityId,
						projects,
					},
				},
			},
		}
	}
}
