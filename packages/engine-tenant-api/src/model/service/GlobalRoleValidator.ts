import { LockType } from '@contember/database'
import { BUILTIN_TENANT_ROLES, GLOBALLY_ASSIGNABLE_BUILTIN_ROLES } from '../authorization/CustomRolePermissions.js'
import { CustomRolesQuery } from '../queries/index.js'
import { DatabaseContext } from '../utils/index.js'

export class GlobalRoleValidator {
	async findInvalidRole(
		db: DatabaseContext,
		roles: readonly string[],
		additionallyActiveRoles: ReadonlySet<string> = new Set(),
	): Promise<string | null> {
		const invalidBuiltin = roles.find(role => BUILTIN_TENANT_ROLES.has(role) && !GLOBALLY_ASSIGNABLE_BUILTIN_ROLES.has(role))
		if (invalidBuiltin !== undefined) {
			return invalidBuiltin
		}
		const customCandidates = [
			...new Set(
				roles.filter(role => !BUILTIN_TENANT_ROLES.has(role) && !additionallyActiveRoles.has(role)),
			),
		].sort()
		if (customCandidates.length === 0) {
			return null
		}
		const customRoles = await db.queryHandler.fetch(
			new CustomRolesQuery({ slugs: customCandidates, lock: LockType.forShare }),
		)
		const existingSlugs = new Set(customRoles.map(role => role.slug))
		return customCandidates.find(role => !existingSlugs.has(role)) ?? null
	}
}
