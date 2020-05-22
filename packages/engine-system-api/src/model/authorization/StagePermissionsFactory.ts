import { Acl, Schema } from '@contember/schema'
import { Permissions } from '@contember/authorization'
import { filterSchemaByStage } from '@contember/schema-utils'
import { AuthorizationActions } from './AuthorizationActions'

export class StagePermissionsFactory {
	constructor(private readonly schema: Schema) {}

	public create(stage: string): Permissions {
		const permissions = new Permissions()

		const filteredSchema = filterSchemaByStage(this.schema, stage)

		const rolePermissions = this.createRolePermissions(filteredSchema.acl)
		Object.entries(rolePermissions).forEach(([role, value]) => {
			// diff
			if (value.diff === Acl.SystemPermissionsLevel.some) {
				permissions.allow(role, AuthorizationActions.PROJECT_DIFF_SOME)
			} else if (value.diff === Acl.SystemPermissionsLevel.any) {
				permissions.allow(role, AuthorizationActions.PROJECT_DIFF_ANY)
				permissions.allow(role, AuthorizationActions.PROJECT_DIFF_SOME)
			}

			// history
			if (value.history === Acl.SystemPermissionsLevel.any) {
				permissions.allow(role, AuthorizationActions.PROJECT_HISTORY_ANY)
			}

			// release
			if (value.release === Acl.SystemPermissionsLevel.some) {
				permissions.allow(role, AuthorizationActions.PROJECT_RELEASE_SOME)
			} else if (value.release === Acl.SystemPermissionsLevel.any) {
				permissions.allow(role, AuthorizationActions.PROJECT_RELEASE_ANY)
				permissions.allow(role, AuthorizationActions.PROJECT_RELEASE_SOME)
			}

			// rebase
			if (value.rebase === Acl.SystemPermissionsLevel.any) {
				permissions.allow(role, AuthorizationActions.PROJECT_REBASE_ANY)
			}

			// migrate
			if (value.migrate) {
				permissions.allow(role, AuthorizationActions.PROJECT_MIGRATE)
			}
		})

		return permissions
	}

	private createRolePermissions(schema: Acl.Schema): Record<string, Acl.SystemPermissions> {
		const rolePermissions: Record<string, Acl.SystemPermissions> = {}
		const recursionGuard = new Set<string>()
		const getRolePermissions = (name: string): Acl.SystemPermissions => {
			if (rolePermissions[name]) {
				return rolePermissions[name]
			}
			if (recursionGuard.has(name)) {
				throw new Error(`Recursive role inheritance detected`)
			}
			recursionGuard.add(name)
			const definition = schema.roles[name]
			const inherits = definition.inherits || []
			const inheritsDefinition = inherits.map(it => getRolePermissions(it))
			rolePermissions[name] = {
				...inheritsDefinition.reduce(
					(def, current) => ({
						...def,
						...current,
					}),
					{},
				),
				...(definition.system || {}),
			}
			recursionGuard.delete(name)
			return rolePermissions[name]
		}
		Object.keys(schema.roles).forEach(getRolePermissions)

		return rolePermissions
	}
}
