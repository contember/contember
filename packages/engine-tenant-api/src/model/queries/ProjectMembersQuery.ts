import { ConditionBuilder, DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'
import { MemberType } from '../../schema'

export class ProjectMembersQuery extends DatabaseQuery<ProjectMembersQueryResult> {
	constructor(
		private readonly projectId: string,
		private readonly memberType?: MemberType,
	) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<ProjectMembersQueryResult> {
		return await SelectBuilder.create<{ id: string; description: string }>()
			.select('id')
			.select('description')
			.from('identity')
			.where(it => it.exists(
				builder => builder
					.from('project_membership')
					.where(expr => expr.columnsEq(['project_membership', 'identity_id'], ['identity', 'id'])),
			))
			.match(qb => {
				if (!this.memberType) {
					return qb
				}
				const expr = ConditionBuilder.create().exists(
					builder => builder
						.from('person')
						.where(expr => expr.columnsEq(['person', 'identity_id'], ['identity', 'id'])),
				)
				if (this.memberType === MemberType.Person) {
					return qb.where(expr)
				}
				return qb.where(ConditionBuilder.not(expr))
			})
			.getResult(db)
	}
}

export interface ProjectMembersQueryRow {
	id: string
	description: string
}

export type ProjectMembersQueryResult = ProjectMembersQueryRow[]
