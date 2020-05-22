export interface IdentityFetcher {
	fetchIdentities(ids: string[]): Promise<TenantIdentity[]>
}

export type TenantIdentity = PersonIdentity | ApiKeyIdentity

export interface PersonIdentity {
	readonly type: 'person'
	readonly identityId: string
	readonly person: {
		id: string
		name: string
	}
}

export interface ApiKeyIdentity {
	readonly type: 'apiKey'
	readonly identityId: string
	readonly description: string
}
