import { Authorizator, Permissions } from '@contember/authorization'
import { PermissionActions } from './PermissionActions.js'
import { TenantRole } from './Roles.js'
import { CustomRoleRow } from '../type/CustomRole.js'

export type GrantablePermission = {
	readonly name: string
	readonly resource: string
	readonly privilege: string
	/** roles-parameterized action — the grant always carries the forbidden-target-roles guard */
	readonly hasRolesMeta: boolean
}

export const BUILTIN_TENANT_ROLES: ReadonlySet<string> = new Set(Object.values(TenantRole))

/** Same set project_admin's grants are guarded by — custom roles can never target these. */
const FORBIDDEN_TARGET_ROLES: ReadonlySet<string> = new Set<string>([TenantRole.SUPER_ADMIN, TenantRole.PROJECT_CREATOR])

/** Privilege-escalation vectors — never grantable to a custom role. */
const NON_GRANTABLE: ReadonlySet<string> = new Set([
	'identity:addGlobalRoles',
	'identity:removeGlobalRoles',
	'apiKey:createGlobal',
	'person:createSessionToken',
	'customRole:manage',
])

const isAction = (value: unknown): value is Authorizator.Action<{}> =>
	typeof value === 'object' && value !== null && 'resource' in value && 'privilege' in value

const buildCatalog = (): ReadonlyMap<string, GrantablePermission> => {
	const catalog = new Map<string, GrantablePermission>()
	for (const value of Object.values(PermissionActions)) {
		const action = typeof value === 'function' ? value([]) : value
		if (!isAction(action)) {
			continue
		}
		const name = `${action.resource}:${action.privilege}`
		if (NON_GRANTABLE.has(name)) {
			continue
		}
		catalog.set(name, {
			name,
			resource: action.resource,
			privilege: action.privilege,
			hasRolesMeta: 'roles' in (action.meta ?? {}),
		})
	}
	return catalog
}

let catalog: ReadonlyMap<string, GrantablePermission> | undefined

/** Permission actions grantable to a custom role, keyed by `resource:privilege`. Derived from {@link PermissionActions} minus escalation vectors. */
export const getGrantablePermissions = (): ReadonlyMap<string, GrantablePermission> => {
	catalog ??= buildCatalog()
	return catalog
}

const targetRolesGuard = (meta: { roles?: readonly string[] } | undefined): boolean => {
	const roles = meta?.roles
	return roles === undefined || roles.every(it => !FORBIDDEN_TARGET_ROLES.has(it))
}

/**
 * Builds a {@link Permissions} map from `custom_role` rows. Unknown or no-longer-grantable
 * permission names are skipped defensively (rows are validated on write, but the catalog may
 * change between engine versions). Roles-parameterized actions always get the same
 * forbidden-target-roles guard as project_admin's static grants.
 */
export const buildCustomRolePermissions = (rows: readonly CustomRoleRow[]): Permissions => {
	const grantable = getGrantablePermissions()
	const permissions = new Permissions()
	for (const row of rows) {
		for (const name of row.permissions) {
			const entry = grantable.get(name)
			if (!entry) {
				continue
			}
			const action = Authorizator.createAction(entry.resource, entry.privilege)
			if (entry.hasRolesMeta) {
				permissions.allow(row.slug, action, targetRolesGuard)
			} else {
				permissions.allow(row.slug, action)
			}
		}
	}
	return permissions
}
