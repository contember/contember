import { DatabaseContext } from '../utils/index.js'
import { PatchIdentityGlobalRoles } from '../commands/index.js'
import { Response, ResponseError, ResponseOk } from '../utils/Response.js'
import { GlobalRoleValidator } from './GlobalRoleValidator.js'
import { Connection } from '@contember/database'

export class RolesManager {
	constructor(
		private readonly globalRoleValidator: GlobalRoleValidator = new GlobalRoleValidator(),
	) {
	}

	async addGlobalRoles(dbContext: DatabaseContext, identityId: string, roles: readonly string[]): Promise<Response<null, GlobalRolesErrorCode>> {
		return await dbContext.transaction(async db => {
			const validation = await this.validateAddedGlobalRoles(db, roles)
			if (!validation.ok) {
				return validation
			}
			return await this.addValidatedGlobalRoles(db, identityId, roles)
		}, { isolation: 'readCommitted' })
	}

	async addValidatedGlobalRoles(
		dbContext: DatabaseContext<Connection.TransactionLike>,
		identityId: string,
		roles: readonly string[],
	): Promise<Response<null, GlobalRolesErrorCode>> {
		return this.patchGlobalRoles(dbContext, identityId, roles, [])
	}

	async validateAddedGlobalRoles(dbContext: DatabaseContext, roles: readonly string[]): Promise<Response<null, GlobalRolesErrorCode>> {
		const invalidRole = await this.globalRoleValidator.findInvalidRole(dbContext, roles)
		return invalidRole === null
			? new ResponseOk(null)
			: new ResponseError('INVALID_ROLE', `Role ${invalidRole} is not valid or globally assignable`)
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
		const result = await dbContext.commandBus.execute(new PatchIdentityGlobalRoles(identityId, addRoles, removeRoles))
		if (!result) {
			return new ResponseError('IDENTITY_NOT_FOUND', `Identity ${identityId} not found`)
		}
		return new ResponseOk(null)
	}
}

type GlobalRolesErrorCode =
	| 'IDENTITY_NOT_FOUND'
	| 'INVALID_ROLE'
