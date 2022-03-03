import { createResolverContext, IdentityTypeResolver, ResolverContext } from '../index'
import { PermissionContextFactory, SignInResult } from '../../model'
import { CommonSignInResult } from '../../schema'

export class SignInResponseFactory {
	constructor(
		private readonly permissionContextFactory: PermissionContextFactory,
		private readonly identityTypeResolver: IdentityTypeResolver,
	) {
	}

	public async createResponse(
		signInResult: SignInResult,
		context: ResolverContext,
	): Promise<CommonSignInResult> {
		const identityId = signInResult.person.identity_id
		const permissionContext = this.permissionContextFactory.create(context.projectGroup, {
			id: identityId,
			roles: signInResult.person.roles,
		})
		const projects = await this.identityTypeResolver.projects(
			{ id: identityId, projects: [] },
			{},
			{
				...context,
				...createResolverContext(permissionContext, context.apiKeyId),
			},
		)
		return {
			token: signInResult.token,
			person: {
				id: signInResult.person.id,
				otpEnabled: !!signInResult.person.otp_activated_at,
				email: signInResult.person.email,
				identity: {
					id: identityId,
					projects,
				},
			},
		}
	}
}
