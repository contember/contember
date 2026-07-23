import {
	CreateCustomRoleResponse,
	DeleteCustomRoleResponse,
	MutationCreateCustomRoleArgs,
	MutationDeleteCustomRoleArgs,
	MutationResolvers,
	MutationUpdateCustomRoleArgs,
	UpdateCustomRoleResponse,
} from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { CustomRoleManager, PermissionActions } from '../../../model/index.js'
import { createErrorResponse } from '../../errorUtils.js'
import { ResponseOk } from '../../../model/utils/Response.js'

/**
 * CRUD over `custom_role` (runtime-defined global roles). Gated by `customRole:manage`,
 * which is deliberately NOT grantable to a custom role — by default only SUPER_ADMIN
 * (via the wildcard grant) can manage role definitions.
 */
export class CustomRoleMutationResolver implements Pick<MutationResolvers, 'createCustomRole' | 'updateCustomRole' | 'deleteCustomRole'> {
	constructor(
		private readonly customRoleManager: CustomRoleManager,
	) {}

	async createCustomRole(parent: any, args: MutationCreateCustomRoleArgs, context: TenantResolverContext): Promise<CreateCustomRoleResponse> {
		await context.requireAccess({
			action: PermissionActions.CUSTOM_ROLE_MANAGE,
			message: 'You are not allowed to manage custom roles',
		})

		const result = await context.db.transaction(async db => {
			const result = await this.customRoleManager.createRole(db, {
				slug: args.slug,
				description: args.description ?? null,
				grants: args.grants,
			})
			if (result.ok) {
				await context.logAuthAction({
					type: 'custom_role_change',
					response: new ResponseOk(null),
					eventData: {
						operation: 'create',
						after: result.result.role,
					},
				}, db)
			}
			return result
		}, { isolation: 'readCommitted' })
		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		return { ok: true }
	}

	async updateCustomRole(parent: any, args: MutationUpdateCustomRoleArgs, context: TenantResolverContext): Promise<UpdateCustomRoleResponse> {
		await context.requireAccess({
			action: PermissionActions.CUSTOM_ROLE_MANAGE,
			message: 'You are not allowed to manage custom roles',
		})

		const result = await context.db.transaction(async db => {
			const result = await this.customRoleManager.updateRole(db, args.slug, {
				description: args.description,
				grants: args.grants,
			})
			if (result.ok) {
				await context.logAuthAction({
					type: 'custom_role_change',
					response: new ResponseOk(null),
					eventData: {
						operation: 'update',
						before: result.result.before,
						after: result.result.after,
					},
				}, db)
			}
			return result
		}, { isolation: 'readCommitted' })
		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		return { ok: true }
	}

	async deleteCustomRole(parent: any, args: MutationDeleteCustomRoleArgs, context: TenantResolverContext): Promise<DeleteCustomRoleResponse> {
		await context.requireAccess({
			action: PermissionActions.CUSTOM_ROLE_MANAGE,
			message: 'You are not allowed to manage custom roles',
		})

		const result = await context.db.transaction(async db => {
			const result = await this.customRoleManager.deleteRole(db, args.slug)
			if (result.ok) {
				await context.logAuthAction({
					type: 'custom_role_change',
					response: new ResponseOk(null),
					eventData: {
						operation: 'delete',
						before: result.result.before,
						removedAssignments: result.result.removedAssignments,
					},
				}, db)
			}
			return result
		}, { isolation: 'readCommitted' })
		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		return { ok: true }
	}
}
