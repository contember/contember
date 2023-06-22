import { DatabaseContext } from '../utils'
import { PatchIdentityGlobalRoles } from '../commands'
import { Response, ResponseError, ResponseOk } from '../utils/Response'
import { TenantRole } from '../authorization'

export class RolesManager {
	async addGlobalRoles(dbContext: DatabaseContext, identityId: string, roles: readonly string[]): Promise<Response<null, GlobalRolesErrorCode>> {
		return this.patchGlobalRoles(dbContext, identityId, roles, [])
	}

	async removeGlobalRoles(dbContext: DatabaseContext, identityId: string, roles: readonly string[]): Promise<Response<null, GlobalRolesErrorCode>> {
		return this.patchGlobalRoles(dbContext, identityId, [], roles)
	}

	private async patchGlobalRoles(dbContext: DatabaseContext, identityId: string, addRoles: readonly string[], removeRoles: readonly string[]): Promise<Response<null, GlobalRolesErrorCode>> {
		const rolesValidationError = this.validateRoles([...addRoles, ...removeRoles])
		if (rolesValidationError) {
			return rolesValidationError
		}
		const result = await dbContext.commandBus.execute(new PatchIdentityGlobalRoles(identityId, addRoles, removeRoles))
		if (!result) {
			return new ResponseError('IDENTITY_NOT_FOUND', `Identity ${identityId} not found`)
		}
		return new ResponseOk(null)
	}


	private validateRoles(roles: string[]): Response<null, GlobalRolesErrorCode> | null {
		for (const role of roles) {
			if (!Object.values(TenantRole).includes(role as TenantRole)) {
				return new ResponseError('INVALID_ROLE', `Role ${role} is not valid`)
			}
		}
		return null
	}
}

type GlobalRolesErrorCode =
	| 'IDENTITY_NOT_FOUND'
	| 'INVALID_ROLE'
