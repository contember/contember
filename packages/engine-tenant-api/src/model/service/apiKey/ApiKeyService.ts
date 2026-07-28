import { DatabaseContext, TokenHash } from '../../utils/index.js'
import { AddProjectMemberCommand, CreateApiKeyCommand, CreateIdentityCommand } from '../../commands/index.js'
import { ApiKey } from '../../type/index.js'
import { createSetMembershipVariables } from '../membershipUtils.js'
import { ImplementationException } from '../../../exceptions.js'
import { Response, ResponseOk } from '../../utils/Response.js'
import { ApiKeyWithToken, CreateApiKeyErrorCode } from '../../../schema/index.js'
import { Acl } from '@contember/schema'

export class ApiKeyService {
	async createPermanentApiKey(
		db: DatabaseContext,
		description: string,
		roles: readonly string[] = [],
		tokenHash?: TokenHash,
		trustForwardedInfo?: boolean,
	) {
		const identityId = await db.commandBus.execute(new CreateIdentityCommand(roles, description))
		const apiKeyResult = await db.commandBus.execute(
			new CreateApiKeyCommand({
				type: ApiKey.Type.PERMANENT,
				identityId,
				tokenHash,
				trustForwardedInfo,
			}),
		)

		return new ResponseOk(new CreateApiKeyResult({ id: identityId, description }, apiKeyResult))
	}

	async createProjectPermanentApiKey(
		db: DatabaseContext,
		projectId: string,
		memberships: readonly Acl.Membership[],
		description: string,
		tokenHash?: TokenHash,
		trustForwardedInfo?: boolean,
	) {
		const response = await this.createPermanentApiKey(db, description, [], tokenHash, trustForwardedInfo)

		const addMemberResult = await db.commandBus.execute(
			new AddProjectMemberCommand(projectId, response.result.identity.id, createSetMembershipVariables(memberships)),
		)
		if (!addMemberResult.ok) {
			throw new ImplementationException()
		}
		return response
	}
}

export type CreateApiKeyResponse = Response<CreateApiKeyResult, CreateApiKeyErrorCode>

export class CreateApiKeyResult {
	constructor(public readonly identity: { id: string; description?: string }, public readonly apiKey: { id: string; token?: string }) {
	}

	toApiKeyWithToken(): ApiKeyWithToken {
		return {
			id: this.apiKey.id,
			token: this.apiKey.token,
			identity: {
				...this.identity,
				projects: [],
				sessions: [],
			},
		}
	}
}
