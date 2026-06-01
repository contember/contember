import { PersonIdentityProvider, QueryResolvers } from '../../schema/index.js'
import { PermissionActions, PersonIdentityProviderManager, PersonQuery } from '../../model/index.js'
import { TenantResolverContext } from '../TenantResolverContext.js'

export class PersonIdentityProvidersQueryResolver implements Pick<QueryResolvers, 'myIdentityProviders'> {
	constructor(
		private readonly personIdentityProviderManager: PersonIdentityProviderManager,
	) {
	}

	async myIdentityProviders(parent: unknown, args: unknown, context: TenantResolverContext): Promise<PersonIdentityProvider[]> {
		await context.requireAccess({
			action: PermissionActions.PERSON_LIST_MY_IDP,
			message: 'You are not allowed to list your identity providers',
		})

		const person = await context.db.queryHandler.fetch(PersonQuery.byIdentity(context.identity.id))
		if (!person) {
			return []
		}

		const connections = await this.personIdentityProviderManager.listPersonIdentityProviders(context.db, person.id)
		return connections.map(it => ({
			id: it.id,
			createdAt: it.createdAt,
			externalIdentifier: it.externalIdentifier,
			identityProvider: {
				slug: it.identityProviderSlug,
				type: it.identityProviderType,
				disabledAt: it.identityProviderDisabledAt,
			},
		}))
	}
}
