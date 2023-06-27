import {
	AddGlobalIdentityRolesResponse,
	MutationAddGlobalIdentityRolesArgs,
	MutationRemoveGlobalIdentityRolesArgs,
	MutationResolvers,
	RemoveGlobalIdentityRolesResponse,
} from '../../../schema'
import { GraphQLResolveInfo } from 'graphql'
import { TenantResolverContext } from '../../TenantResolverContext'
import { PermissionActions } from '../../../model'
import { createErrorResponse } from '../../errorUtils'
import { RolesManager } from '../../../model'

export class IdentityGlobalRolesMutationResolver implements MutationResolvers {
	constructor(
		private readonly rolesManager: RolesManager,
	) {
	}

	async addGlobalIdentityRoles(
		parent: any,
		{ roles, identityId }: MutationAddGlobalIdentityRolesArgs,
		context: TenantResolverContext,
		info: GraphQLResolveInfo,
	): Promise<AddGlobalIdentityRolesResponse> {
		await context.requireAccess({
			action: PermissionActions.IDENTITY_ADD_GLOBAL_ROLES(roles),
			message: 'You are not allowed to add global roles',
		})

		const result = await this.rolesManager.addGlobalRoles(context.db, identityId, roles)

		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		return {
			ok: true,
			result: {
				identity: { id: identityId, projects: [] },
			},
		}
	}

	async removeGlobalIdentityRoles(
		parent: any,
		{ roles, identityId }: MutationRemoveGlobalIdentityRolesArgs,
		context: TenantResolverContext,
		info: GraphQLResolveInfo,
	): Promise<RemoveGlobalIdentityRolesResponse> {
		await context.requireAccess({
			action: PermissionActions.IDENTITY_REMOVE_GLOBAL_ROLES(roles),
			message: 'You are not allowed to remove global roles',
		})

		const result = await this.rolesManager.removeGlobalRoles(context.db, identityId, roles)

		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		return {
			ok: true,
			result: {
				identity: { id: identityId, projects: [] },
			},
		}
	}
}
