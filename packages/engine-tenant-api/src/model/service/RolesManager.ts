import { DatabaseContext } from '../utils/index.js'
import { PatchIdentityGlobalRoles } from '../commands/index.js'
import { Response, ResponseError, ResponseOk } from '../utils/Response.js'
import { BUILTIN_TENANT_ROLES } from '../authorization/CustomRolePermissions.js'
import { CustomRolesQuery } from '../queries/index.js'

export class RolesManager {
	async addGlobalRoles(dbContext: DatabaseContext, identityId: string, roles: readonly string[]): Promise<Response<null, GlobalRolesErrorCode>> {
		return this.patchGlobalRoles(dbContext, identityId, roles, [])
	}

	async removeGlobalRoles(dbContext: DatabaseContext, identityId: string, roles: readonly string[]): Promise<Response<null, GlobalRolesErrorCode>> {
		return this.patchGlobalRoles(dbContext, identityId, [], roles)
	}

	private async patchGlobalRoles(
		dbContext: DatabaseContext,
		identityId: string,
		addRoles: readonly string[],
		removeRoles: readonly string[],
	): Promise<Response<null, GlobalRolesErrorCode>> {
		// Only added roles are validated — removal must stay possible for a slug whose
		// custom-role definition has been deleted in the meantime.
		const rolesValidationError = await this.validateAddedRoles(dbContext, addRoles)
		if (rolesValidationError) {
			return rolesValidationError
		}
		const result = await dbContext.commandBus.execute(new PatchIdentityGlobalRoles(identityId, addRoles, removeRoles))
		if (!result) {
			return new ResponseError('IDENTITY_NOT_FOUND', `Identity ${identityId} not found`)
		}
		return new ResponseOk(null)
	}

	/** A role is valid when it is either a built-in tenant role or a defined custom role. */
	private async validateAddedRoles(dbContext: DatabaseContext, roles: readonly string[]): Promise<Response<null, GlobalRolesErrorCode> | null> {
		const customCandidates = roles.filter(it => !BUILTIN_TENANT_ROLES.has(it))
		if (customCandidates.length === 0) {
			return null
		}
		const customRoles = await dbContext.queryHandler.fetch(new CustomRolesQuery({ slugs: customCandidates }))
		const existingSlugs = new Set(customRoles.map(it => it.slug))
		const missingRole = customCandidates.find(it => !existingSlugs.has(it))
		if (missingRole !== undefined) {
			return new ResponseError('INVALID_ROLE', `Role ${missingRole} is not valid`)
		}
		return null
	}
}

type GlobalRolesErrorCode =
	| 'IDENTITY_NOT_FOUND'
	| 'INVALID_ROLE'
