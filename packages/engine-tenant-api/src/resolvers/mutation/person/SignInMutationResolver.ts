import { MutationResolvers, MutationSignInArgs, SignInResponse } from '../../../schema'
import { ResolverContext } from '../../ResolverContext'
import { PermissionActions, PermissionContextFactory, SignInManager } from '../../../model'
import { IdentityTypeResolver } from '../../types'
import { createResolverContext } from '../../ResolverContextFactory'

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

		const result = await this.signInManager.signIn(
			args.email,
			args.password,
			args.expiration || undefined,
			args.otpToken || undefined,
		)

		if (!result.ok) {
			return {
				ok: false,
				errors: result.errors.map(errorCode => ({ code: errorCode })),
			}
		}

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
