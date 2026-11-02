import { Acl } from '@contember/schema'
import { WorkloadIdentityTrustInput } from '../../../schema/index.js'
import { WorkloadIdentity } from '../../../model/type/index.js'
import { parseConditions } from '../../../model/service/workloadIdentity/conditions.js'
import { parseAssumeRule } from '../../../model/service/workloadIdentity/apply/assumeRule.js'
import { ApplyResponse, createApplyError } from '../../../model/service/workloadIdentity/apply/applyErrors.js'
import { ResponseOk } from '../../../model/utils/Response.js'
import { parseWorkloadIdentityProfile } from './workloadIdentityTrustResponse.js'

/** Parses the JSON-typed parts of the input once; the definition rules are checked by the manager. */
export const parseWorkloadIdentityTrustInput = (input: WorkloadIdentityTrustInput): ApplyResponse<WorkloadIdentity.TrustDefinition> => {
	const conditions = parseConditions(input.conditions)
	if (!conditions.ok) {
		return createApplyError(
			'INVALID_CONDITIONS',
			'Invalid conditions: ' + conditions.errors.map(it => it.message).join('; '),
			conditions.errors.map(({ index, message }) => ({ index, message })),
		)
	}

	const ruleErrors: { project: string; role: string; message: string }[] = []
	const memberships: WorkloadIdentity.MembershipDefinition[] = []
	for (const membership of input.memberships ?? []) {
		let assumeMembership: Acl.MembershipMatchRule | undefined
		if (membership.assumeMembership !== null && membership.assumeMembership !== undefined) {
			const parsed = parseAssumeRule(membership.assumeMembership)
			if (!parsed.ok) {
				ruleErrors.push({ project: membership.project, role: membership.role, message: parsed.message })
				continue
			}
			assumeMembership = parsed.rule
		}
		memberships.push({
			project: membership.project,
			role: membership.role,
			variables: (membership.variables ?? []).map(({ name, values }) => ({ name, values })),
			...(assumeMembership !== undefined ? { assumeMembership } : {}),
		})
	}
	if (ruleErrors.length > 0) {
		return createApplyError('INVALID_ENVELOPE', 'Envelope rules must have the MembershipMatchRule shape', ruleErrors)
	}

	return new ResponseOk({
		profile: parseWorkloadIdentityProfile(input.profile),
		issuer: input.issuer,
		audience: input.audience,
		conditions: conditions.conditions,
		jwksUri: input.jwksUri ?? undefined,
		signingAlgs: input.signingAlgs ?? undefined,
		acceptedTyp: input.acceptedTyp?.map(it => it ?? null) ?? undefined,
		acceptAudienceArray: input.acceptAudienceArray ?? undefined,
		requireDpop: input.requireDpop ?? undefined,
		maxTokenLifetime: input.maxTokenLifetime ?? undefined,
		trustForwardedInfo: input.trustForwardedInfo ?? undefined,
		description: input.description ?? undefined,
		roles: input.roles ?? [],
		memberships,
		disabled: input.disabled ?? false,
	})
}
