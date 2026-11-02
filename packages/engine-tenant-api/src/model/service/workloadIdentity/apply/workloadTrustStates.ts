import { Acl } from '@contember/schema'
import { DatabaseContext } from '../../../utils/index.js'
import { ImplementationException } from '../../../../exceptions.js'
import { WorkloadIdentityMembershipsQuery } from '../../../queries/workloadIdentity/WorkloadIdentityMembershipsQuery.js'
import {
	WorkloadTrustDetail,
	WorkloadTrustDetailFilter,
	WorkloadTrustDetailQuery,
} from '../../../queries/workloadIdentity/WorkloadTrustDetailQuery.js'
import { parseAssumeRule } from './assumeRule.js'

export interface WorkloadTrustMembership extends Acl.Membership {
	readonly id: string
	readonly projectId: string
	readonly project: string
	readonly assumeMembership: Acl.MembershipMatchRule | null
}

/** A stored trust with its identity's memberships and envelope rules — the whole applied definition. */
export interface WorkloadTrustState extends WorkloadTrustDetail {
	readonly memberships: readonly WorkloadTrustMembership[]
}

export const parseStoredAssumeRule = (value: unknown): Acl.MembershipMatchRule => {
	// Stored rules were validated at apply; a row that no longer parses fails closed.
	const parsed = parseAssumeRule(value)
	if (!parsed.ok) {
		throw new ImplementationException(`Invalid stored workload identity envelope rule: ${parsed.message}`)
	}
	return parsed.rule
}

/** Every trust (`null` filter) or the matching ones, each with its full applied definition. */
export const fetchWorkloadTrustStates = async (
	db: DatabaseContext,
	filter: WorkloadTrustDetailFilter | null,
): Promise<readonly WorkloadTrustState[]> => {
	const details = await db.queryHandler.fetch(new WorkloadTrustDetailQuery(filter))
	const memberships = await db.queryHandler.fetch(new WorkloadIdentityMembershipsQuery(details.map(it => it.trust.identityId)))
	return details.map(detail => ({
		...detail,
		memberships: memberships
			.filter(it => it.identityId === detail.trust.identityId)
			.map(it => ({
				id: it.id,
				projectId: it.projectId,
				project: it.projectSlug,
				role: it.role,
				variables: it.variables,
				assumeMembership: it.rule === null ? null : parseStoredAssumeRule(it.rule),
			})),
	}))
}
