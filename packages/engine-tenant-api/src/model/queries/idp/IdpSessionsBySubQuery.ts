import { DatabaseQuery, DatabaseQueryable, Operator, SelectBuilder } from '@contember/database'
import { IdpSessionBySidRow } from './IdpSessionsBySidQuery.js'

/**
 * Find the federated sessions for a given subject (`sub`) under a specific identity provider — the
 * lookup an OIDC back-channel logout performs when the IdP sends a `sub`-only logout token (no `sid`),
 * which targets *all* of that subject's sessions (OIDC Back-Channel Logout 1.0 §2.4). The subject is
 * the `external_identifier` recorded in `person_identity_provider` at sign-in, so we walk
 * `idp_session → api_key → person → person_identity_provider` to map `sub` to the local session(s) to
 * revoke. Both the session row and the `person_identity_provider` row are constrained to the same
 * provider so a `sub` is only ever interpreted under the IdP that asserted it.
 *
 * Assumption: a person maps to a single subject per provider (the normal case — one IdP link per
 * person). `idp_session` stores no `sub` of its own, so once a person is matched we revoke *all* of
 * that person's sessions under the provider. If a person were ever linked to the same IdP under two
 * subjects, a logout for one subject would also revoke the other's sessions — over-revocation, which
 * is the safe direction for a logout (it never leaves a session the IdP asked to terminate alive).
 */
export class IdpSessionsBySubQuery extends DatabaseQuery<IdpSessionBySidRow[]> {
	constructor(
		private readonly identityProviderId: string,
		private readonly sub: string,
	) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<IdpSessionBySidRow[]> {
		const rows = await SelectBuilder.create<{ id: string; api_key_id: string }>()
			.from('idp_session')
			.join('api_key', 'api_key', on => on.compareColumns(['idp_session', 'api_key_id'], Operator.eq, ['api_key', 'id']))
			.join('person', 'person', on => on.compareColumns(['api_key', 'identity_id'], Operator.eq, ['person', 'identity_id']))
			.join('person_identity_provider', 'pip', on => on.compareColumns(['person', 'id'], Operator.eq, ['pip', 'person_id']))
			.where(where =>
				where
					.compare(['idp_session', 'identity_provider_id'], Operator.eq, this.identityProviderId)
					.compare(['pip', 'identity_provider_id'], Operator.eq, this.identityProviderId)
					.compare(['pip', 'external_identifier'], Operator.eq, this.sub)
			)
			.select(['idp_session', 'id'])
			.select(['idp_session', 'api_key_id'])
			.getResult(db)

		return rows.map(row => ({ id: row.id, apiKeyId: row.api_key_id }))
	}
}
