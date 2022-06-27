import { DatabaseContext, TokenHash } from '../../utils'
import { AddProjectMemberCommand, CreateApiKeyCommand, CreateIdentityCommand } from '../../commands'
import { ApiKey } from '../../type'
import { createSetMembershipVariables } from '../membershipUtils'
import { ImplementationException } from '../../../exceptions'
import { Response, ResponseOk } from '../../utils/Response'
import { ApiKeyWithToken } from '../../../schema'
import { Acl } from '@contember/schema'

export class ApiKeyService {
	async createPermanentApiKey(
		db: DatabaseContext,
		description: string,
		roles: readonly string[] = [],
		tokenHash?: TokenHash,
	) {
		const identityId = await db.commandBus.execute(new CreateIdentityCommand(roles, description))
		const apiKeyResult = await db.commandBus.execute(new CreateApiKeyCommand({ type: ApiKey.Type.PERMANENT, identityId, tokenHash }))

		return new ResponseOk(new CreateApiKeyResult({ id: identityId, description }, apiKeyResult))
	}

	async createProjectPermanentApiKey(
		db: DatabaseContext,
		projectId: string,
		memberships: readonly Acl.Membership[],
		description: string,
		tokenHash?: TokenHash,
	) {
		const response = await this.createPermanentApiKey(db, description, [], tokenHash)

		const addMemberResult = await db.commandBus.execute(
			new AddProjectMemberCommand(projectId, response.result.identity.id, createSetMembershipVariables(memberships)),
		)
		if (!addMemberResult.ok) {
			throw new ImplementationException()
		}
		return response
	}
}


export type CreateApiKeyResponse = Response<CreateApiKeyResult, never>

export class CreateApiKeyResult {
	constructor(public readonly identity: {id: string; description?: string}, public readonly apiKey: { id: string; token?: string }) {
	}

	toApiKeyWithToken(): ApiKeyWithToken {
		return {
			id: this.apiKey.id,
			token: this.apiKey.token,
			identity: {
				...this.identity,
				projects: [],
			},
		}
	}
}
