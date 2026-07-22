import { CustomRole, QueryResolvers } from '../../schema/index.js'
import { CustomRoleManager, PermissionActions } from '../../model/index.js'
import { getGrantablePermissions } from '../../model/authorization/CustomRolePermissions.js'
import { TenantResolverContext } from '../TenantResolverContext.js'

/** Lists custom roles and the grantable permission vocabulary. Gated by `customRole:view`. */
export class CustomRoleQueryResolver implements Pick<QueryResolvers, 'customRoles' | 'customRolePermissions'> {
	constructor(
		private readonly customRoleManager: CustomRoleManager,
	) {}

	async customRoles(parent: unknown, args: unknown, context: TenantResolverContext): Promise<readonly CustomRole[]> {
		await context.requireAccess({
			action: PermissionActions.CUSTOM_ROLE_VIEW,
			message: 'You are not allowed to view custom roles',
		})

		const rows = await this.customRoleManager.listRoles(context.db)
		return rows.map((row): CustomRole => ({
			slug: row.slug,
			description: row.description,
			permissions: row.permissions,
		}))
	}

	async customRolePermissions(parent: unknown, args: unknown, context: TenantResolverContext): Promise<readonly string[]> {
		await context.requireAccess({
			action: PermissionActions.CUSTOM_ROLE_VIEW,
			message: 'You are not allowed to view custom role permissions',
		})

		return [...getGrantablePermissions().keys()].sort()
	}
}
