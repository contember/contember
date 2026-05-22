import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'

/**
 * Returns every (project_id, role) pair the identity holds across ALL projects.
 *
 * Unlike {@link ProjectRolesByIdentityQuery}, which is scoped to a single
 * project, this aggregates over the identity's entire project-membership set.
 * Required by {@link AuthPolicyResolver}, because signIn issues a project-agnostic
 * (global) session and must evaluate MFA / session policy against the whole role
 * set.
 */
class AllProjectRolesByIdentityQuery extends DatabaseQuery<AllProjectRolesByIdentityQuery.Result> {
	constructor(private readonly identityId: string) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<AllProjectRolesByIdentityQuery.Result> {
		const result = await SelectBuilder.create<{ project_id: string; role: string }>()
			.select('project_id')
			.select('role')
			.from('project_membership')
			.where({
				identity_id: this.identityId,
			})
			.getResult(db)

		return result.map(it => ({ projectId: it.project_id, role: it.role }))
	}
}

namespace AllProjectRolesByIdentityQuery {
	export type Row = { projectId: string; role: string }
	export type Result = readonly Row[]
}

export { AllProjectRolesByIdentityQuery }
