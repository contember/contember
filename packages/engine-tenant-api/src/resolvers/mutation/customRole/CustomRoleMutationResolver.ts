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
 * (via the wildcard grant) can manage role definitions. Every mutation audits
 * `custom_role_change` with a snapshot of the input.
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

		const result = await this.customRoleManager.createRole(context.db, {
			slug: args.slug,
			description: args.description ?? null,
			permissions: args.permissions,
		})
		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		await context.logAuthAction({
			type: 'custom_role_change',
			response: new ResponseOk(null),
			eventData: {
				operation: 'create',
				slug: args.slug,
				permissions: [...args.permissions],
				description: args.description ?? null,
			},
		})

		return { ok: true }
	}

	async updateCustomRole(parent: any, args: MutationUpdateCustomRoleArgs, context: TenantResolverContext): Promise<UpdateCustomRoleResponse> {
		await context.requireAccess({
			action: PermissionActions.CUSTOM_ROLE_MANAGE,
			message: 'You are not allowed to manage custom roles',
		})

		const result = await this.customRoleManager.updateRole(context.db, args.slug, {
			description: args.description,
			permissions: args.permissions ?? undefined,
		})
		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		await context.logAuthAction({
			type: 'custom_role_change',
			response: new ResponseOk(null),
			eventData: {
				operation: 'update',
				slug: args.slug,
				...(args.permissions !== undefined && args.permissions !== null ? { permissions: [...args.permissions] } : {}),
				...(args.description !== undefined ? { description: args.description } : {}),
			},
		})

		return { ok: true }
	}

	async deleteCustomRole(parent: any, args: MutationDeleteCustomRoleArgs, context: TenantResolverContext): Promise<DeleteCustomRoleResponse> {
		await context.requireAccess({
			action: PermissionActions.CUSTOM_ROLE_MANAGE,
			message: 'You are not allowed to manage custom roles',
		})

		const result = await this.customRoleManager.deleteRole(context.db, args.slug)
		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		await context.logAuthAction({
			type: 'custom_role_change',
			response: new ResponseOk(null),
			eventData: {
				operation: 'delete',
				slug: args.slug,
			},
		})

		return { ok: true }
	}
}
