import { JSONObject, JSONValue } from '@contember/schema'
import { WorkloadIdentityProfile, WorkloadIdentityTrust } from '../../../schema/index.js'
import { WorkloadIdentity } from '../../../model/type/index.js'
import { EnvelopeClosureEntry } from '../../../model/service/workloadIdentity/apply/WorkloadIdentityManager.js'
import { WorkloadTrustState } from '../../../model/service/workloadIdentity/apply/workloadTrustStates.js'

export const parseWorkloadIdentityProfile = (profile: WorkloadIdentityProfile): WorkloadIdentity.Profile =>
	profile === 'github_actions' ? 'github-actions' : 'oidc'

const formatWorkloadIdentityProfile = (profile: WorkloadIdentity.Profile): WorkloadIdentityProfile =>
	profile === 'github-actions' ? 'github_actions' : 'oidc'

export const createWorkloadIdentityTrustResponse = (
	{ trust, memberships, createdAt, updatedAt, tokensValidAfter }: WorkloadTrustState,
): WorkloadIdentityTrust => ({
	id: trust.id,
	slug: trust.slug,
	profile: formatWorkloadIdentityProfile(trust.profile),
	issuer: trust.issuer,
	audience: trust.audience,
	jwksUri: trust.jwksUri,
	signingAlgs: trust.signingAlgs,
	acceptedTyp: trust.acceptedTyp,
	acceptAudienceArray: trust.acceptAudienceArray,
	requireDpop: trust.requireDpop,
	conditions: trust.conditions,
	maxTokenLifetime: trust.maxTokenLifetimeSeconds,
	trustForwardedInfo: trust.trustForwardedInfo,
	description: trust.description,
	disabled: trust.disabled,
	tokensValidAfter,
	roles: trust.roles,
	memberships: memberships.map(it => ({
		project: it.project,
		role: it.role,
		variables: it.variables,
		assumeMembership: it.assumeMembership,
	})),
	// projects / sessions are resolved lazily by IdentityTypeResolver
	identity: { id: trust.identityId, description: trust.description, projects: [], sessions: [] },
	createdAt,
	updatedAt,
})

export const envelopeClosureToJson = (closure: readonly EnvelopeClosureEntry[]): JSONValue =>
	closure.map(entry => ({
		project: entry.project,
		membership: {
			role: entry.membership.role,
			variables: entry.membership.variables.map(({ name, values }) => ({ name, values: [...values] })),
		},
		targets: entry.targets.map(target => ({
			role: target.role,
			variables: target.variables,
			unbounded: target.unbounded,
			sensitiveFlags: [...target.sensitiveFlags],
		})),
	}))

/** The applied definition as recorded in the auth log; the same shape the listing returns. */
export const workloadTrustAuditSnapshot = ({ trust, memberships }: WorkloadTrustState): JSONObject => ({
	id: trust.id,
	slug: trust.slug,
	identityId: trust.identityId,
	profile: trust.profile,
	issuer: trust.issuer,
	audience: trust.audience,
	jwksUri: trust.jwksUri,
	signingAlgs: [...trust.signingAlgs],
	acceptedTyp: [...trust.acceptedTyp],
	acceptAudienceArray: trust.acceptAudienceArray,
	requireDpop: trust.requireDpop,
	conditions: trust.conditions,
	maxTokenLifetime: trust.maxTokenLifetimeSeconds,
	trustForwardedInfo: trust.trustForwardedInfo,
	description: trust.description,
	disabled: trust.disabled,
	roles: [...trust.roles],
	memberships: memberships.map(it => ({
		project: it.project,
		role: it.role,
		variables: it.variables.map(({ name, values }) => ({ name, values: [...values] })),
		assumeMembership: it.assumeMembership,
	})),
})
