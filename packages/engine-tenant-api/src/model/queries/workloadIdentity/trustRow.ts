import { Literal, SelectBuilder } from '@contember/database'
import { WorkloadIdentity } from '../../type/index.js'
import { parseConditions } from '../../service/workloadIdentity/conditions.js'
import { ImplementationException } from '../../../exceptions.js'

interface WorkloadTrustDbRow {
	id: string
	slug: string
	identity_id: string
	issuer: string
	audience: string
	profile: string
	jwks_uri: string | null
	signing_algs: string[]
	accepted_typ: (string | null)[]
	accept_audience_array: boolean
	require_dpop: boolean
	conditions: unknown
	max_token_lifetime_seconds: number
	tokens_valid_after_epoch: string | number
	trust_forwarded_info: boolean
	disabled: boolean
	description: string | null
	roles: unknown
}

/** Every trust read selects through this, so the verifier and the apply diff see the same row. */
export const createWorkloadTrustQuery = () =>
	SelectBuilder.create<WorkloadTrustDbRow>()
		.select(['workload_identity_trust', 'id'])
		.select(['workload_identity_trust', 'slug'])
		.select(['workload_identity_trust', 'identity_id'])
		.select(['workload_identity_trust', 'issuer'])
		.select(['workload_identity_trust', 'audience'])
		.select(['workload_identity_trust', 'profile'])
		.select(['workload_identity_trust', 'jwks_uri'])
		.select(['workload_identity_trust', 'signing_algs'])
		.select(['workload_identity_trust', 'accepted_typ'])
		.select(['workload_identity_trust', 'accept_audience_array'])
		.select(['workload_identity_trust', 'require_dpop'])
		.select(['workload_identity_trust', 'conditions'])
		.select(['workload_identity_trust', 'max_token_lifetime_seconds'])
		.select(new Literal('extract(epoch from "workload_identity_trust"."tokens_valid_after")'), 'tokens_valid_after_epoch')
		.select(['workload_identity_trust', 'trust_forwarded_info'])
		.select(new Literal('"workload_identity_trust"."disabled_at" IS NOT NULL'), 'disabled')
		.select(['identity', 'description'])
		.select(['identity', 'roles'])
		.from('workload_identity_trust')
		.join('identity', 'identity', it => it.columnsEq(['identity', 'id'], ['workload_identity_trust', 'identity_id']))

const parseProfile = (value: string): WorkloadIdentity.Profile => {
	if (value === 'oidc' || value === 'github-actions') {
		return value
	}
	throw new ImplementationException(`Unknown workload identity profile ${value}`)
}

const parseRoles = (value: unknown): readonly string[] => {
	if (!Array.isArray(value) || !value.every((it): it is string => typeof it === 'string')) {
		throw new ImplementationException('Invalid identity roles')
	}
	return value
}

export const createWorkloadTrustRow = (row: WorkloadTrustDbRow): WorkloadIdentity.TrustRow => {
	// Stored conditions were validated at apply; a row that no longer parses fails closed.
	const conditions = parseConditions(row.conditions)
	if (!conditions.ok) {
		throw new ImplementationException(`Invalid stored conditions of workload identity trust ${row.slug}`)
	}
	return {
		id: row.id,
		slug: row.slug,
		identityId: row.identity_id,
		issuer: row.issuer,
		audience: row.audience,
		profile: parseProfile(row.profile),
		jwksUri: row.jwks_uri,
		signingAlgs: row.signing_algs,
		acceptedTyp: row.accepted_typ,
		acceptAudienceArray: row.accept_audience_array,
		requireDpop: row.require_dpop,
		conditions: conditions.conditions,
		maxTokenLifetimeSeconds: row.max_token_lifetime_seconds,
		tokensValidAfter: Number(row.tokens_valid_after_epoch),
		trustForwardedInfo: row.trust_forwarded_info,
		disabled: row.disabled,
		description: row.description,
		roles: parseRoles(row.roles),
	}
}
