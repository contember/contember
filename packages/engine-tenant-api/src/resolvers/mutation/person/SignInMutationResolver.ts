import { MutationResolvers, MutationSignInArgs, SignInResponse } from '../../../schema'
import { ResolverContext } from '../../ResolverContext'
import { PermissionActions, PermissionContextFactory, SignInManager } from '../../../model'
import { IdentityTypeResolver } from '../../types'
import { createResolverContext } from '../../ResolverContextFactory'
import { createErrorResponse } from '../../errorUtils'

export class SignInMutationResolver implements MutationResolvers {
	constructor(
		private readonly signInManager: SignInManager,
		private readonly identityTypeResolver: IdentityTypeResolver,
		private readonly permissionContextFactory: PermissionContextFactory,
	) {}

	async signIn(parent: any, args: MutationSignInArgs, context: ResolverContext): Promise<SignInResponse> {
		await context.requireAccess({
			action: PermissionActions.PERSON_SIGN_IN,
			message: 'You are not allowed to sign in',
		})

		const response = await this.signInManager.signIn(
			context.db,
			args.email,
			args.password,
			args.expiration || undefined,
			args.otpToken || undefined,
		)

		if (!response.ok) {
			return createErrorResponse(response.error, response.errorMessage)
		}
		const result = response.result
		const identityId = result.person.identity_id
		const permissionContext = this.permissionContextFactory.create(context.projectGroup, { id: identityId, roles: result.person.roles })
		const projects = await this.identityTypeResolver.projects(
			{ id: identityId, projects: [] },
			{},
			{
				...context,
				...createResolverContext(permissionContext, context.apiKeyId),
			},
		)
		return {
			ok: true,
			errors: [],
			result: {
				token: result.token,
				person: {
					id: result.person.id,
					otpEnabled: !!result.person.otp_activated_at,
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
