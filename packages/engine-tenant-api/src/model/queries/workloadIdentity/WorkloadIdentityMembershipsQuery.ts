import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'
import { Acl } from '@contember/schema'

export interface WorkloadIdentityMembershipRow {
	readonly id: string
	readonly identityId: string
	readonly projectId: string
	readonly projectSlug: string
	readonly role: string
	readonly variables: readonly Acl.MembershipVariable[]
	/** The stored envelope rule bound to this membership; parsed by the caller. */
	readonly rule: unknown
}

/** Every project membership of the given (trust) identities, with the envelope rule bound to it. */
export class WorkloadIdentityMembershipsQuery extends DatabaseQuery<readonly WorkloadIdentityMembershipRow[]> {
	constructor(
		private readonly identityIds: readonly string[],
	) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<readonly WorkloadIdentityMembershipRow[]> {
		if (this.identityIds.length === 0) {
			return []
		}
		return await SelectBuilder.create<WorkloadIdentityMembershipRow>()
			.with('memberships', qb =>
				qb
					.select(['project_membership', 'id'])
					.select(['project_membership', 'role'])
					.select(['project_membership', 'identity_id'])
					.select(['project_membership', 'project_id'])
					.select(['project', 'slug'], 'project_slug')
					.from('project_membership')
					.join('project', undefined, it => it.columnsEq(['project', 'id'], ['project_membership', 'project_id']))
					.where(it => it.in(['project_membership', 'identity_id'], [...this.identityIds])))
			.with('variables', qb =>
				qb
					.select('membership_id')
					.select(it => it.raw("json_agg(json_build_object('name', variable, 'values', value))"), 'variables')
					.from('project_membership_variable')
					.join('memberships', undefined, it => it.columnsEq(['project_membership_variable', 'membership_id'], ['memberships', 'id']))
					.groupBy('membership_id'))
			.select(['memberships', 'id'])
			.select(['memberships', 'identity_id'], 'identityId')
			.select(['memberships', 'project_id'], 'projectId')
			.select(['memberships', 'project_slug'], 'projectSlug')
			.select(['memberships', 'role'])
			.select(it => it.raw("coalesce(variables, '[]'::json)"), 'variables')
			.select(['workload_identity_assume_rule', 'rule'])
			.from('memberships')
			.leftJoin('variables', undefined, it => it.columnsEq(['memberships', 'id'], ['variables', 'membership_id']))
			.leftJoin(
				'workload_identity_assume_rule',
				undefined,
				it => it.columnsEq(['workload_identity_assume_rule', 'membership_id'], ['memberships', 'id']),
			)
			.orderBy(['memberships', 'project_slug'])
			.orderBy(['memberships', 'role'])
			.getResult(db)
	}
}
