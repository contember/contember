import {
	AddGlobalIdentityRolesResponse,
	MutationAddGlobalIdentityRolesArgs,
	MutationRemoveGlobalIdentityRolesArgs,
	MutationResolvers,
	RemoveGlobalIdentityRolesResponse,
} from '../../../schema/index.js'
import { GraphQLResolveInfo } from 'graphql'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { createTargetIdentityPermissionTarget, PermissionActions, RolesManager } from '../../../model/index.js'
import { createErrorResponse } from '../../errorUtils.js'
import { IdentityQuery } from '../../../model/queries/identity/IdentityQuery.js'
import { PersonByIdentityBatchQuery } from '../../../model/queries/person/PersonByIdentityBatchQuery.js'
import { ResponseOk } from '../../../model/utils/Response.js'

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
		// cheap gate first, so a caller holding the permission in no form cannot probe identity existence
		await context.requireAccess({
			action: PermissionActions.IDENTITY_ADD_GLOBAL_ROLES(),
			message: 'You are not allowed to add global roles',
		})

		const [before] = await context.db.queryHandler.fetch(new IdentityQuery([identityId]))
		if (before === undefined) {
			return createErrorResponse('IDENTITY_NOT_FOUND', `Identity ${identityId} not found`)
		}
		await context.requireAccess({
			action: PermissionActions.IDENTITY_ADD_GLOBAL_ROLES({
				requestedRoles: roles,
				target: await createTargetIdentityPermissionTarget(context.db, before),
				self: identityId === context.identity.id,
			}),
			message: 'You are not allowed to add these global roles',
		})

		const result = await this.rolesManager.addGlobalRoles(context.db, identityId, roles)
		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		await this.logRolesChange(context, identityId, 'global_role_grant', before.roles)

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
			action: PermissionActions.IDENTITY_REMOVE_GLOBAL_ROLES(),
			message: 'You are not allowed to remove global roles',
		})

		const [before] = await context.db.queryHandler.fetch(new IdentityQuery([identityId]))
		if (before === undefined) {
			return createErrorResponse('IDENTITY_NOT_FOUND', `Identity ${identityId} not found`)
		}
		await context.requireAccess({
			action: PermissionActions.IDENTITY_REMOVE_GLOBAL_ROLES({
				requestedRoles: roles,
				target: await createTargetIdentityPermissionTarget(context.db, before),
				self: identityId === context.identity.id,
			}),
			message: 'You are not allowed to remove these global roles',
		})

		const result = await this.rolesManager.removeGlobalRoles(context.db, identityId, roles)
		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		await this.logRolesChange(context, identityId, 'global_role_revoke', before.roles)

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
