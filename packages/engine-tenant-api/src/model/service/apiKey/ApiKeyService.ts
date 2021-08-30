import { Membership } from '../../type/Membership'
import { DatabaseContext } from '../../utils'
import { AddProjectMemberCommand, CreateApiKeyCommand, CreateIdentityCommand } from '../../commands'
import { ApiKey } from '../../type'
import { createSetMembershipVariables } from '../membershipUtils'
import { ImplementationException } from '../../../exceptions'
import { Response, ResponseOk } from '../../utils/Response'

export class ApiKeyService {
	async createProjectPermanentApiKey(
		db: DatabaseContext,
		projectId: string,
		memberships: readonly Membership[],
		description: string,
	) {
		const identityId = await db.commandBus.execute(new CreateIdentityCommand([], description))
		const apiKeyResult = await db.commandBus.execute(new CreateApiKeyCommand(ApiKey.Type.PERMANENT, identityId))

		const addMemberResult = await db.commandBus.execute(
			new AddProjectMemberCommand(projectId, identityId, createSetMembershipVariables(memberships)),
		)
		if (!addMemberResult.ok) {
			throw new ImplementationException()
		}

		return new ResponseOk(new CreateApiKeyResult(identityId, apiKeyResult))
	}
}


export type CreateApiKeyResponse = Response<CreateApiKeyResult, never>

export class CreateApiKeyResult {
	constructor(public readonly identityId: string, public readonly apiKey: { id: string; token: string }) {
	}
}
