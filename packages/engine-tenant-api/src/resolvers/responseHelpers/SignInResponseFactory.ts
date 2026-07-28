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

	public async createResponse(
		signInResult: SignInResult,
		context: TenantResolverContext,
	): Promise<CommonSignInResult & { backupCodes?: readonly string[] }> {
		const identityId = signInResult.person.identity_id
		const permissionContext = this.permissionContextFactory.create(context.db, {
			id: identityId,
			roles: signInResult.person.roles,
		}, context.permissionContext.authorizator)
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
			// Present only when this sign-in completed an MFA enrollment (A06).
			...(signInResult.backupCodes ? { backupCodes: signInResult.backupCodes } : {}),
		}
	}
}
