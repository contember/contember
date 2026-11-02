import { WorkloadIdentity } from '../../type/index.js'

/** The stored columns of a trust, defaults already filled in. */
export interface WorkloadTrustValues {
	readonly profile: WorkloadIdentity.Profile
	readonly issuer: string
	readonly audience: string
	readonly jwksUri: string | null
	readonly signingAlgs: readonly string[]
	readonly acceptedTyp: readonly (string | null)[]
	readonly acceptAudienceArray: boolean
	readonly requireDpop: boolean
	readonly conditions: readonly WorkloadIdentity.Condition[]
	readonly maxTokenLifetime: number
	readonly trustForwardedInfo: boolean
	readonly disabled: boolean
}

export const workloadTrustColumns = (values: WorkloadTrustValues) => ({
	profile: values.profile,
	issuer: values.issuer,
	audience: values.audience,
	jwks_uri: values.jwksUri,
	signing_algs: values.signingAlgs,
	accepted_typ: values.acceptedTyp,
	accept_audience_array: values.acceptAudienceArray,
	require_dpop: values.requireDpop,
	conditions: JSON.stringify(values.conditions),
	max_token_lifetime_seconds: values.maxTokenLifetime,
	trust_forwarded_info: values.trustForwardedInfo,
})
