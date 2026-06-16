import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'

export type IdpSessionBySidRow = {
	id: string
	apiKeyId: string
}

/**
 * Find the federated sessions established for a given IdP session id (`sid`) under a specific
 * identity provider — the lookup an OIDC back-channel logout performs to map the IdP's `sid` to the
 * local session(s) to revoke (A10). Hits the `(identity_provider_id, idp_session_id)` index added by
 * A24. A single `sid` can in principle back more than one local session, so this returns all matches.
 */
export class IdpSessionsBySidQuery extends DatabaseQuery<IdpSessionBySidRow[]> {
	constructor(
		private readonly identityProviderId: string,
		private readonly sid: string,
	) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<IdpSessionBySidRow[]> {
		const rows = await SelectBuilder.create<{ id: string; api_key_id: string }>()
			.from('idp_session')
			.where({
				identity_provider_id: this.identityProviderId,
				idp_session_id: this.sid,
			})
			.select('id')
			.select('api_key_id')
			.getResult(db)

		return rows.map(row => ({ id: row.id, apiKeyId: row.api_key_id }))
	}
}
