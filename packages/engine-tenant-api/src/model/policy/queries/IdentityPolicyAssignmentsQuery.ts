import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'
import { IdentityPolicyAssignment } from '../PolicyDto.js'

export class IdentityPolicyAssignmentsQuery extends DatabaseQuery<IdentityPolicyAssignment[]> {
	constructor(private readonly identityId: string) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<IdentityPolicyAssignment[]> {
		const rows = await SelectBuilder.create<{
			identity_id: string
			policy_id: string
			tags: Record<string, unknown>
			granted_by: string | null
			granted_at: Date
		}>()
			.select('identity_id').select('policy_id').select('tags')
			.select('granted_by').select('granted_at')
			.from('identity_policy')
			.where({ identity_id: this.identityId })
			.getResult(queryable.db)
		return rows.map(row => ({
			identityId: row.identity_id,
			policyId: row.policy_id,
			tags: row.tags ?? {},
			grantedBy: row.granted_by,
			grantedAt: row.granted_at,
		}))
	}
}
