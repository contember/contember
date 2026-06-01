import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'

export interface PersonIdentityProviderRow {
	readonly id: string
	readonly createdAt: Date
	readonly externalIdentifier: string
	readonly identityProviderSlug: string
	readonly identityProviderType: string
	readonly identityProviderDisabledAt: Date | null
}

/**
 * Lists the external IdP connections of a single person, joined with the
 * identity provider they belong to. Used by the `myIdentityProviders` query
 * and by the disconnect flow to enforce ownership and lock-out protection.
 */
export class PersonIdentityProvidersQuery extends DatabaseQuery<PersonIdentityProviderRow[]> {
	constructor(
		private readonly personId: string,
	) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<PersonIdentityProviderRow[]> {
		return await SelectBuilder.create<PersonIdentityProviderRow>()
			.select(['person_identity_provider', 'id'])
			.select(['person_identity_provider', 'created_at'], 'createdAt')
			.select(['person_identity_provider', 'external_identifier'], 'externalIdentifier')
			.select(['identity_provider', 'slug'], 'identityProviderSlug')
			.select(['identity_provider', 'type'], 'identityProviderType')
			.select(['identity_provider', 'disabled_at'], 'identityProviderDisabledAt')
			.from('person_identity_provider')
			.join(
				'identity_provider',
				'identity_provider',
				expr => expr.columnsEq(['identity_provider', 'id'], ['person_identity_provider', 'identity_provider_id']),
			)
			.where({ person_id: this.personId })
			.getResult(db)
	}
}
