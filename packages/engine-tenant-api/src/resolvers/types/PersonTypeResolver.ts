import { Person, PersonIdentityProvider, PersonResolvers } from '../../schema/index.js'
import { type Config, ConfigurationQuery, IdentityQuery, PermissionActions, PersonIdentityProviderManager } from '../../model/index.js'
import { isPasswordlessEnabled } from '../../model/service/helpers/isPasswordlessEnabled.js'
import { TenantResolverContext } from '../TenantResolverContext.js'

export class PersonTypeResolver implements Pick<PersonResolvers, 'identityProviders' | 'passwordlessAvailable' | 'passwordlessSelfManaged'> {
	/**
	 * One configuration read per request rather than per person: `person$$` selects every scalar, so
	 * listing N people would otherwise issue N identical config queries. Keyed on the resolver context,
	 * which is built once per operation and collected with it.
	 */
	private readonly configurationByRequest = new WeakMap<TenantResolverContext, Promise<Config>>()

	constructor(
		private readonly personIdentityProviderManager: PersonIdentityProviderManager,
	) {
	}

	/**
	 * The tenant policy resolved against the person's own flag — the same call `signIn` makes, so a
	 * client never has to reimplement it (and could not: reading `configuration` needs `system:viewConfig`,
	 * which an ordinary person does not have).
	 */
	async passwordlessAvailable(parent: Person, args: unknown, context: TenantResolverContext): Promise<boolean> {
		const config = await this.configuration(context)
		return isPasswordlessEnabled(config.passwordless.enabled, parent.passwordlessEnabled ?? null)
	}

	async passwordlessSelfManaged(parent: Person, args: unknown, context: TenantResolverContext): Promise<boolean> {
		const config = await this.configuration(context)
		return config.passwordless.enabled === 'optIn' || config.passwordless.enabled === 'optOut'
	}

	private configuration(context: TenantResolverContext): Promise<Config> {
		const cached = this.configurationByRequest.get(context)
		if (cached) {
			return cached
		}
		const pending = context.db.queryHandler.fetch(new ConfigurationQuery(context.db.providers))
		this.configurationByRequest.set(context, pending)
		return pending
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
