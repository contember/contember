import { AuthorizationScope } from '@contember/authorization'
import { DatabaseQuery, DatabaseQueryable } from '@contember/database'
import { Identity } from '@contember/engine-common'
import { PermissionActions, ProjectsQuery } from '../'
import { PermissionContext } from '../authorization/PermissionContext'

class ProjectsByIdentityQuery extends DatabaseQuery<ProjectsByIdentityQuery.Result> {
	constructor(private readonly identityId: string, private readonly permissionContext: PermissionContext) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<ProjectsByIdentityQuery.Result> {
		const identityResult = await queryable
			.createSelectBuilder<{ roles: string[] }>()
			.from('identity')
			.where({
				id: this.identityId,
			})
			.select('roles')
			.getResult()
		const identityRow = this.fetchOneOrNull(identityResult)
		if (!identityRow) {
			return []
		}
		const identity = new Identity.StaticIdentity(this.identityId, identityRow.roles, {})
		const canViewAll = await this.permissionContext.authorizator.isAllowed(
			identity,
			new AuthorizationScope.Global(),
			PermissionActions.PROJECT_VIEW,
		)
		const canAuthorizedEntityViewAll = await this.permissionContext.authorizator.isAllowed(
			this.permissionContext.identity,
			new AuthorizationScope.Global(),
			PermissionActions.PROJECT_VIEW,
		)
		if (canViewAll && canAuthorizedEntityViewAll) {
			return await new ProjectsQuery().fetch(queryable)
		}

		const qb = queryable
			.createSelectBuilder<ProjectsByIdentityQuery.Row>()
			.select(['project', 'id'])
			.select(['project', 'name'])
			.select(['project', 'slug'])
			.from('project')
			.where(where =>
				where.in(
					['project', 'id'],
					queryable
						.createSelectBuilder()
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
						queryable
							.createSelectBuilder()
							.from('project_membership')
							.select('project_id')
							.where({
								identity_id: this.permissionContext.identity.id,
							}),
					),
			  )

		return await qbWithIdentityPermissions.getResult()
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
