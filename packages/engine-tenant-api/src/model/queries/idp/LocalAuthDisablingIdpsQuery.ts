import { DatabaseQuery, DatabaseQueryable, Operator, SelectBuilder } from '@contember/database'

/**
 * Slugs of the identity providers that forbid this person every local
 * authentication method — password sign-in, passwordless sign-in and the
 * password-reset mail. Empty means local authentication is available.
 *
 * The IdP link is the marker, so this also covers a person who predates the
 * provider and was linked to it by e-mail matching, not only one created by
 * auto-sign-up. A DISABLED provider does not count: turning the provider off
 * hands local authentication back to everyone linked to it, which is the
 * break-glass when the IdP is unreachable.
 */
export class LocalAuthDisablingIdpsQuery extends DatabaseQuery<string[]> {
	constructor(
		private readonly personId: string,
	) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<string[]> {
		const rows = await SelectBuilder.create<{ slug: string }>()
			.select(['identity_provider', 'slug'], 'slug')
			.from('person_identity_provider')
			.join(
				'identity_provider',
				'identity_provider',
				expr => expr.columnsEq(['identity_provider', 'id'], ['person_identity_provider', 'identity_provider_id']),
			)
			.where(where =>
				where
					.compare(['person_identity_provider', 'person_id'], Operator.eq, this.personId)
					.compare(['identity_provider', 'disable_local_authentication'], Operator.eq, true)
					.isNull(['identity_provider', 'disabled_at'])
			)
			.orderBy(['identity_provider', 'slug'])
			.getResult(db)

		return rows.map(it => it.slug)
	}
}
