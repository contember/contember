import { Policy } from '@contember/policy'

export interface PolicyDto {
	id: string
	slug: string
	label: string
	description: string | null
	document: Policy
	version: number
	createdAt: Date
	updatedAt: Date
}

export interface IdentityPolicyAssignment {
	identityId: string
	policyId: string
	tags: Record<string, unknown>
	grantedBy: string | null
	grantedAt: Date
}
