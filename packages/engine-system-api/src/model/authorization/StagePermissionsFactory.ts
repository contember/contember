import { Acl } from '@contember/schema'
import { Permissions } from '@contember/authorization'
import { AuthorizationActions } from './AuthorizationActions'
import { SchemaGetter } from '../SchemaGetter'

export class StagePermissionsFactory {
	constructor(private readonly getSchema: SchemaGetter) {}

	public async create(stage: string): Promise<Permissions> {
		const permissions = new Permissions()

		const filteredSchema = await this.getSchema({ stage })

		const rolePermissions = this.createRolePermissions(filteredSchema.acl)
		Object.entries(rolePermissions).forEach(([role, value]) => {
			// history
			if (value.history === Acl.SystemPermissionsLevel.any || value.history === true) {
				permissions.allow(role, AuthorizationActions.PROJECT_HISTORY_ANY)
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
