import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'
import { MemberType, ProjectMembersInput } from '../../../schema'
import { ImplementationException } from '../../../exceptions'

export class ProjectMembersQuery extends DatabaseQuery<ProjectMembersQueryResult> {

	constructor(
		private readonly projectId: string,
		private readonly projectMemberInput: ProjectMembersInput,
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
					.where(expr => expr.columnsEq(['project_membership', 'identity_id'], ['identity', 'id']))
					.where({ project_id: this.projectId }),
			))
			.match(qb => {
				const identityId = this.projectMemberInput.filter?.identityId
				return identityId ? qb.where(it => it.in(['identity', 'id'], identityId)) : qb
			})
			.match(qb => {
				const { email, memberType, personId } = this.projectMemberInput.filter ?? {}
				if ((email || personId) && memberType === 'API_KEY') {
					throw new ImplementationException()
				}

				const personQuery = SelectBuilder.create()
					.from('person')
					.where(expr => expr.columnsEq(['person', 'identity_id'], ['identity', 'id']))
					.match(qb => email ? qb.where(it => it.in('email', email)) : qb)
					.match(qb => personId ? qb.where(it => it.in(['person', 'id'], personId)) : qb)


				if (email || personId || memberType === 'PERSON') {
					return qb.where(it => it.exists(personQuery))
				}

				if (memberType === 'API_KEY') {
					return qb.where(it => it.not(it => it.exists(personQuery)))
				}

				return qb
			})
			.limit(this.projectMemberInput.limit ?? undefined, this.projectMemberInput.offset ?? undefined)
			.getResult(db)
	}
}

export interface ProjectMembersQueryRow {
	id: string
	description: string
}

export type ProjectMembersQueryResult = ProjectMembersQueryRow[]
