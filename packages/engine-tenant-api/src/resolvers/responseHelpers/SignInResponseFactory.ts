import { createResolverContext, IdentityTypeResolver, TenantResolverContext } from '../index.js'
import { PermissionContextFactory, SignInResult } from '../../model/index.js'
import { CommonSignInResult } from '../../schema/index.js'
import { PersonResponseFactory } from './PersonResponseFactory.js'

export class SignInResponseFactory {
	constructor(
		private readonly permissionContextFactory: PermissionContextFactory,
		private readonly identityTypeResolver: IdentityTypeResolver,
	) {
	}

	public async createResponse(signInResult: SignInResult, context: TenantResolverContext): Promise<CommonSignInResult> {
		const identityId = signInResult.person.identity_id
		const permissionContext = this.permissionContextFactory.create(context.db, {
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
			person: PersonResponseFactory.createPersonResponse(signInResult.person, projects),
		}
	}
}
