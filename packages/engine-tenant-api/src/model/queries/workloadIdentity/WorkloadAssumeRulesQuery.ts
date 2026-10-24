import { DatabaseQuery, DatabaseQueryable, Operator, SelectBuilder } from '@contember/database'
import { Acl } from '@contember/schema'

export interface WorkloadAssumeRuleRow {
	readonly role: string
	readonly variables: readonly Acl.MembershipVariable[]
	/** The stored envelope rule; parsed by the caller. */
	readonly rule: unknown
}

/** Envelope rules of one trust in one project, each with the stored membership of the trust identity it is bound to (§7a.1). */
export class WorkloadAssumeRulesQuery extends DatabaseQuery<readonly WorkloadAssumeRuleRow[]> {
	constructor(
		private readonly trustId: string,
		private readonly projectSlug: string,
	) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<readonly WorkloadAssumeRuleRow[]> {
		return await SelectBuilder.create<WorkloadAssumeRuleRow>()
			.with('memberships', qb =>
				qb
					.select(['project_membership', 'id'])
					.select(['project_membership', 'role'])
					.select(['workload_identity_assume_rule', 'rule'])
					.from('workload_identity_assume_rule')
					.join('workload_identity_trust', undefined, it => it.columnsEq(['workload_identity_trust', 'id'], ['workload_identity_assume_rule', 'trust_id']))
					.join(
						'project_membership',
						undefined,
						it =>
							it
								.columnsEq(['project_membership', 'id'], ['workload_identity_assume_rule', 'membership_id'])
								.columnsEq(['project_membership', 'identity_id'], ['workload_identity_trust', 'identity_id']),
					)
					.join('project', undefined, it => it.columnsEq(['project', 'id'], ['project_membership', 'project_id']))
					.where(it =>
						it
							.compare(['workload_identity_assume_rule', 'trust_id'], Operator.eq, this.trustId)
							.compare(['project', 'slug'], Operator.eq, this.projectSlug)
					))
			.with('variables', qb =>
				qb
					.select('membership_id')
					.select(it => it.raw("json_agg(json_build_object('name', variable, 'values', value))"), 'variables')
					.from('project_membership_variable')
					.join('memberships', undefined, it => it.columnsEq(['project_membership_variable', 'membership_id'], ['memberships', 'id']))
					.groupBy('membership_id'))
			.select(['memberships', 'role'])
			.select(it => it.raw("coalesce(variables, '[]'::json)"), 'variables')
			.select(['memberships', 'rule'])
			.from('memberships')
			.leftJoin('variables', undefined, it => it.columnsEq(['memberships', 'id'], ['variables', 'membership_id']))
			.orderBy(['memberships', 'role'])
			.getResult(db)
	}
}
