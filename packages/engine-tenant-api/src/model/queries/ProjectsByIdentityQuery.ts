import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'
import { ProjectsQuery } from './ProjectsQuery'
import { PermissionActions, PermissionContext } from '../authorization'
import { Project } from '../type'

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
					SelectBuilder.create() //
						.from('project_membership')
						.select('project_id')
						.where({
							identity_id: this.identityId,
						}),
				),
			)

		const qbWithIdentityPermissions = canAuthorizedEntityViewAll
			? qb
			: qb.where(where =>
				where.in(
					['project', 'id'],
					SelectBuilder.create().from('project_membership').select('project_id').where({
						identity_id: this.permissionContext.identity.id,
					}),
				),
			  )

		return await qbWithIdentityPermissions.getResult(queryable.db)
	}
}
