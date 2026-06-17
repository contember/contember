import { Person, PersonIdentityProvider, PersonResolvers } from '../../schema/index.js'
import { IdentityQuery, PermissionActions, PersonIdentityProviderManager } from '../../model/index.js'
import { TenantResolverContext } from '../TenantResolverContext.js'

export class PersonTypeResolver implements Pick<PersonResolvers, 'identityProviders'> {
	constructor(
		private readonly personIdentityProviderManager: PersonIdentityProviderManager,
	) {
	}

	async identityProviders(parent: Person, args: unknown, context: TenantResolverContext): Promise<PersonIdentityProvider[]> {
		// Self: always allowed. Other persons: gated by PERSON_VIEW_IDP against the
		// target's roles, so PROJECT_ADMIN can inspect members but not SUPER_ADMINs.
		// Return [] instead of throwing so listing many persons does not abort on a
		// single forbidden target — mirrors `Identity.sessions`.
		if (parent.identity.id !== context.identity.id) {
			const [identity] = await context.db.queryHandler.fetch(new IdentityQuery([parent.identity.id]))
			const canView = await context.permissionContext.isAllowed({
				action: PermissionActions.PERSON_VIEW_IDP(identity?.roles ?? []),
			})
			if (!canView) {
				return []
			}
		}

		const connections = await this.personIdentityProviderManager.listPersonIdentityProviders(context.db, parent.id)
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
