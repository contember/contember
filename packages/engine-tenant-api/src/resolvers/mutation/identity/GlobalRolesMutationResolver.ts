import {
	AddGlobalIdentityRolesResponse,
	MutationAddGlobalIdentityRolesArgs,
	MutationRemoveGlobalIdentityRolesArgs,
	MutationResolvers,
	RemoveGlobalIdentityRolesResponse,
} from '../../../schema'
import { GraphQLResolveInfo } from 'graphql'
import { TenantResolverContext } from '../../TenantResolverContext'
import { PermissionActions, RolesManager } from '../../../model'
import { createErrorResponse } from '../../errorUtils'
import { IdentityQuery } from '../../../model/queries/identity/IdentityQuery'
import { PersonByIdentityBatchQuery } from '../../../model/queries/person/PersonByIdentityBatchQuery'
import { ResponseOk } from '../../../model/utils/Response'

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

		const [before] = await context.db.queryHandler.fetch(new IdentityQuery([identityId]))
		const result = await this.rolesManager.addGlobalRoles(context.db, identityId, roles)

		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		await this.logRolesChange(context, identityId, 'global_role_grant', before?.roles ?? [])

		return {
			ok: true,
			result: {
				identity: { id: identityId, projects: [], sessions: [] },
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

		const [before] = await context.db.queryHandler.fetch(new IdentityQuery([identityId]))
		const result = await this.rolesManager.removeGlobalRoles(context.db, identityId, roles)

		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		await this.logRolesChange(context, identityId, 'global_role_revoke', before?.roles ?? [])

		return {
			ok: true,
			result: {
				identity: { id: identityId, projects: [], sessions: [] },
			},
		}
	}

	private async logRolesChange(
		context: TenantResolverContext,
		identityId: string,
		auditType: 'global_role_grant' | 'global_role_revoke',
		beforeRoles: readonly string[],
	): Promise<void> {
		const [after] = await context.db.queryHandler.fetch(new IdentityQuery([identityId]))
		const [targetPerson] = await context.db.queryHandler.fetch(new PersonByIdentityBatchQuery([identityId]))
		await context.logAuthAction({
			type: auditType,
			response: new ResponseOk(null),
			targetPersonId: targetPerson?.id,
			eventData: {
				before: { roles: beforeRoles },
				after: { roles: after?.roles ?? [] },
			},
		})
	}
}
