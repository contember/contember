import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'
import { ProjectsQuery } from './ProjectsQuery.js'
import { PermissionActions, PermissionContext } from '../../authorization/index.js'
import { withUnexpiredLease } from '../membership/index.js'
import { Project } from '../../type/index.js'

export class ProjectsByIdentityQuery extends DatabaseQuery<Project[]> {
	constructor(private readonly identityId: string, private readonly permissionContext: PermissionContext) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<Project[]> {
		const canAuthorizedEntityViewAll = await this.permissionContext.isAllowed({
			action: PermissionActions.PROJECT_VIEW,
		})

		if (this.identityId === this.permissionContext.identity.id && canAuthorizedEntityViewAll) {
			return await new ProjectsQuery().fetch(queryable)
		}

		const qb = SelectBuilder.create<Project>()
			.select(['project', 'id'])
			.select(['project', 'name'])
			.select(['project', 'slug'])
			.select(['project', 'config'])
			.from('project')
			.where(where =>
				where.in(
					['project', 'id'],
					// deliberately unleased: this asks which projects the SUBJECT is associated with, and a lapsed
					// membership still associates them — filtering here would hide an inactive member from operators
					SelectBuilder.create() //
						.from('project_membership')
						.select('project_id')
						.where({
							identity_id: this.identityId,
						}),
				)
			)

		const qbWithIdentityPermissions = canAuthorizedEntityViewAll
			? qb
			: qb.where(where =>
				where.in(
					['project', 'id'],
					// the CALLER's own membership, so this one IS an access decision: a lapsed lease grants no view
					SelectBuilder.create().from('project_membership').select('project_id').where({
						identity_id: this.permissionContext.identity.id,
					}).match(withUnexpiredLease()),
				)
			)

		return await qbWithIdentityPermissions.getResult(queryable.db)
	}
}
