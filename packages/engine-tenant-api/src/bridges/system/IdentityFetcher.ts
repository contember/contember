import { Client } from '@contember/database'
import { IdentityQuery, PersonByIdentityBatchQuery } from '../../model'

export class IdentityFetcher {
	public async fetchIdentities(client: Client, ids: string[]): Promise<Identity[]> {
		const queryHandler = client.createQueryHandler()
		const persons = await queryHandler.fetch(new PersonByIdentityBatchQuery(ids))
		const personIds = new Set(persons.map(it => it.identity_id))
		const otherIdentityIds = ids.filter(it => !personIds.has(it))
		const otherIdentities = await queryHandler.fetch(new IdentityQuery(otherIdentityIds))

		return [
			...persons.map(
				it =>
					new PersonIdentity(it.identity_id, {
						id: it.id,
						name: it.email.substring(0, it.email.indexOf('@')), // todo
					}),
			),
			...otherIdentities.map(it => new ApiKeyIdentity(it.id, it.description)),
		]
	}
}

export type Identity = PersonIdentity | ApiKeyIdentity

export class PersonIdentity {
	public readonly type = 'person' as const

	constructor(
		public readonly identityId: string,
		public readonly person: {
			id: string
			name: string
		},
	) {}
}

export class ApiKeyIdentity {
	public readonly type = 'apiKey' as const

	constructor(public readonly identityId: string, public readonly description: string) {}
}
