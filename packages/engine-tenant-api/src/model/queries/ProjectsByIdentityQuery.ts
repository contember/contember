import { AuthorizationScope } from '@contember/authorization'
import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'
import { ProjectsQuery } from './ProjectsQuery'
import { PermissionActions, PermissionContext, StaticIdentity } from '../authorization'

class ProjectsByIdentityQuery extends DatabaseQuery<ProjectsByIdentityQuery.Result> {
	constructor(private readonly identityId: string, private readonly permissionContext: PermissionContext) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<ProjectsByIdentityQuery.Result> {
		const identityResult = await SelectBuilder.create<{ roles: string[] }>()
			.from('identity')
			.where({
				id: this.identityId,
			})
			.select('roles')
			.getResult(queryable.db)
		const identityRow = this.fetchOneOrNull(identityResult)
		if (!identityRow) {
			return []
		}
		const identity = new StaticIdentity(this.identityId, identityRow.roles)
		const canViewAll = await this.permissionContext.authorizator.isAllowed(
			identity,
			new AuthorizationScope.Global(),
			PermissionActions.PROJECT_VIEW,
		)
		if (canViewAll && this.identityId === this.permissionContext.identity.id) {
			return await new ProjectsQuery().fetch(queryable)
		}

		const qb = SelectBuilder.create<ProjectsByIdentityQuery.Row>()
			.select(['project', 'id'])
			.select(['project', 'name'])
			.select(['project', 'slug'])
			.from('project')
			.where(where =>
				where.in(
					['project', 'id'],
					SelectBuilder.create()
						.from('project_membership')
						.select('project_id')
						.where({
							identity_id: this.identityId,
						}),
				),
			)

		const canAuthorizedEntityViewAll = await this.permissionContext.isAllowed({
			scope: new AuthorizationScope.Global(),
			action: PermissionActions.PROJECT_VIEW,
		})

		const qbWithIdentityPermissions = canAuthorizedEntityViewAll
			? qb
			: qb.where(where =>
					where.in(
						['project', 'id'],
						SelectBuilder.create()
							.from('project_membership')
							.select('project_id')
							.where({
								identity_id: this.permissionContext.identity.id,
							}),
					),
			  )

		return await qbWithIdentityPermissions.getResult(queryable.db)
	}
}

namespace ProjectsByIdentityQuery {
	export type Row = {
		readonly id: string
		readonly name: string
		readonly slug: string
	}
	export type Result = Array<Row>
}

export { ProjectsByIdentityQuery }
