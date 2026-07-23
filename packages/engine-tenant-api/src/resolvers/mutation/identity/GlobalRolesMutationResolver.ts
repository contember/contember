import {
	AddGlobalIdentityRolesResponse,
	MutationAddGlobalIdentityRolesArgs,
	MutationRemoveGlobalIdentityRolesArgs,
	MutationResolvers,
	RemoveGlobalIdentityRolesResponse,
} from '../../../schema/index.js'
import { GraphQLResolveInfo } from 'graphql'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { createTargetIdentityPermissionTarget, DatabaseContext, PermissionActions, RolesManager } from '../../../model/index.js'
import { createErrorResponse } from '../../errorUtils.js'
import { IdentityQuery } from '../../../model/queries/identity/IdentityQuery.js'
import { PersonByIdentityBatchQuery } from '../../../model/queries/person/PersonByIdentityBatchQuery.js'
import { ResponseOk } from '../../../model/utils/Response.js'
import { LockType } from '@contember/database'

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
			action: PermissionActions.IDENTITY_ADD_GLOBAL_ROLES(),
			message: 'You are not allowed to add global roles',
		})

		return await context.db.transaction(async db => {
			const roleValidation = await this.rolesManager.validateAddedGlobalRoles(db, roles)
			if (!roleValidation.ok) {
				return createErrorResponse(roleValidation.error, roleValidation.errorMessage)
			}
			const [before] = await db.queryHandler.fetch(new IdentityQuery([identityId], LockType.forUpdate))
			if (before === undefined) {
				return createErrorResponse('IDENTITY_NOT_FOUND', `Identity ${identityId} not found`)
			}
			const target = await createTargetIdentityPermissionTarget(db, before)
			await context.requireAccess({
				action: PermissionActions.IDENTITY_ADD_GLOBAL_ROLES({
					requestedRoles: roles,
					target,
					self: identityId === context.identity.id,
				}),
				message: 'You are not allowed to add these global roles',
			})
			const result = await this.rolesManager.addValidatedGlobalRoles(db, identityId, roles)

			if (!result.ok) {
				return createErrorResponse(result.error, result.errorMessage)
			}

			await this.logRolesChange(db, context, identityId, 'global_role_grant', before.roles)

			return {
				ok: true,
				result: {
					identity: { id: identityId, projects: [], sessions: [] },
				},
			}
		}, { isolation: 'readCommitted' })
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

		return await context.db.transaction(async db => {
			const [before] = await db.queryHandler.fetch(new IdentityQuery([identityId], LockType.forUpdate))
			if (before === undefined) {
				return createErrorResponse('IDENTITY_NOT_FOUND', `Identity ${identityId} not found`)
			}
			const target = await createTargetIdentityPermissionTarget(db, before)
			await context.requireAccess({
				action: PermissionActions.IDENTITY_REMOVE_GLOBAL_ROLES({
					requestedRoles: roles,
					target,
					self: identityId === context.identity.id,
				}),
				message: 'You are not allowed to remove these global roles',
			})
			const result = await this.rolesManager.removeGlobalRoles(db, identityId, roles)

			if (!result.ok) {
				return createErrorResponse(result.error, result.errorMessage)
			}

			await this.logRolesChange(db, context, identityId, 'global_role_revoke', before.roles)

			return {
				ok: true,
				result: {
					identity: { id: identityId, projects: [], sessions: [] },
				},
			}
		}, { isolation: 'readCommitted' })
	}

	private async logRolesChange(
		db: DatabaseContext,
		context: TenantResolverContext,
		identityId: string,
		auditType: 'global_role_grant' | 'global_role_revoke',
		beforeRoles: readonly string[],
	): Promise<void> {
		const [after] = await db.queryHandler.fetch(new IdentityQuery([identityId]))
		const [targetPerson] = await db.queryHandler.fetch(new PersonByIdentityBatchQuery([identityId]))
		await context.logAuthAction({
			type: auditType,
			response: new ResponseOk(null),
			targetPersonId: targetPerson?.id,
			eventData: {
				before: { roles: beforeRoles },
				after: { roles: after?.roles ?? [] },
			},
		}, db)
	}
}
