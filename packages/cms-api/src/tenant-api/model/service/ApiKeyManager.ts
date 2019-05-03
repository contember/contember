import DbQueryable from '../../../core/database/DbQueryable'
import QueryHandler from '../../../core/query/QueryHandler'
import ApiKey from '../type/ApiKey'
import ApiKeyByTokenQuery from '../queries/ApiKeyByTokenQuery'
import Client from '../../../core/database/Client'
import CreateIdentityCommand from '../commands/CreateIdentityCommand'
import Identity from '../../../common/auth/Identity'
import CreateApiKey from '../commands/CreateApiKey'
import DisableOneOffApiKeyCommand from '../commands/DisableOneOffApiKeyCommand'
import ProlongApiKey from '../commands/ProlongApiKey'
import UpdateProjectMemberVariablesCommand from '../commands/UpdateProjectMemberVariablesCommand'
import AddProjectMemberCommand from '../commands/AddProjectMemberCommand'
import {
	AddProjectMemberErrorCode,
	CreateApiKeyErrorCode,
	UpdateProjectMemberVariablesErrorCode,
} from '../../schema/types'
import ImplementationException from '../../../core/exceptions/ImplementationException'
import { mapValues } from '../../utils/mapValue'

class ApiKeyManager {
	constructor(private readonly queryHandler: QueryHandler<DbQueryable>, private readonly db: Client) {}

	async verifyAndProlong(token: string): Promise<ApiKeyManager.VerifyResult> {
		const apiKeyRow = await this.queryHandler.fetch(new ApiKeyByTokenQuery(token))
		if (apiKeyRow === null) {
			return new ApiKeyManager.VerifyResultError(ApiKeyManager.VerifyErrorCode.NOT_FOUND)
		}

		if (apiKeyRow.disabled_at !== null) {
			return new ApiKeyManager.VerifyResultError(ApiKeyManager.VerifyErrorCode.DISABLED)
		}

		const now = new Date()
		if (apiKeyRow.expires_at !== null && apiKeyRow.expires_at <= now) {
			return new ApiKeyManager.VerifyResultError(ApiKeyManager.VerifyErrorCode.EXPIRED)
		}

		setImmediate(async () => {
			await new ProlongApiKey(apiKeyRow.id, apiKeyRow.type, apiKeyRow.expiration || undefined).execute(this.db)
		})

		return new ApiKeyManager.VerifyResultOk(apiKeyRow.identity_id, apiKeyRow.id, apiKeyRow.roles)
	}

	async createSessionApiKey(identityId: string, expiration?: number): Promise<string> {
		return (await new CreateApiKey(ApiKey.Type.SESSION, identityId, expiration).execute(this.db)).token
	}

	async createLoginApiKey(): Promise<ApiKeyManager.CreateApiKeyResult> {
		const response = await this.createPermanentApiKey([Identity.SystemRole.LOGIN], [])
		if (!response.ok) {
			throw new ImplementationException(response.errors.join(', '))
		}
		return response.result
	}

	async disableOneOffApiKey(apiKeyId: string): Promise<void> {
		await new DisableOneOffApiKeyCommand(apiKeyId).execute(this.db)
	}

	async createPermanentApiKey(
		roles: string[],
		projects: { id: string; roles: string[]; variables: UpdateProjectMemberVariablesCommand.VariableUpdate[] }[]
	): Promise<ApiKeyManager.CreateApiKeyResponse> {
		return await this.db.transaction(async db => {
			const identityId = await new CreateIdentityCommand(roles).execute(db)
			const apiKeyResult = await new CreateApiKey(ApiKey.Type.PERMANENT, identityId).execute(db)

			const addMemberResponses = (await Promise.all(
				projects.map(async project => {
					return new AddProjectMemberCommand(project.id, identityId, project.roles).execute(db)
				})
			))
				.filter((it): it is AddProjectMemberCommand.AddProjectMemberResponseError => !it.ok)
				.map(it => it.errors)
				.map(
					mapValues<AddProjectMemberErrorCode, CreateApiKeyErrorCode>({
						[AddProjectMemberErrorCode.ProjectNotFound]: CreateApiKeyErrorCode.ProjectNotFound,
						[AddProjectMemberErrorCode.IdentityNotFound]: ImplementationException.Throw,
						[AddProjectMemberErrorCode.AlreadyMember]: ImplementationException.Throw,
					})
				)
				.reduce((acc, val) => [...acc, ...val], [])

			if (addMemberResponses.length > 0) {
				return new ApiKeyManager.CreateApiKeyResponseError(addMemberResponses)
			}

			const updateVariablesResponses = (await Promise.all(
				projects.filter(project => project.variables.length > 0).map(project => {
					return new UpdateProjectMemberVariablesCommand(project.id, identityId, project.variables).execute(db)
				})
			))
				.filter((it): it is UpdateProjectMemberVariablesCommand.UpdateProjectMemberVariablesResponseError => !it.ok)
				.map(it => it.errors)
				.map(
					mapValues<UpdateProjectMemberVariablesErrorCode, CreateApiKeyErrorCode>({
						[UpdateProjectMemberVariablesErrorCode.VariableNotFound]: CreateApiKeyErrorCode.VariableNotFound,
						[UpdateProjectMemberVariablesErrorCode.ProjectNotFound]: ImplementationException.Throw,
						[UpdateProjectMemberVariablesErrorCode.IdentityNotFound]: ImplementationException.Throw,
					})
				)
				.reduce((acc, val) => [...acc, ...val], [])

			if (updateVariablesResponses.length > 0) {
				return new ApiKeyManager.CreateApiKeyResponseError(updateVariablesResponses)
			}

			return new ApiKeyManager.CreateApiKeyResponseOk(new ApiKeyManager.CreateApiKeyResult(identityId, apiKeyResult))
		})
	}
}

namespace ApiKeyManager {
	export type VerifyResult = VerifyResultOk | VerifyResultError

	export class VerifyResultOk {
		readonly valid = true

		constructor(
			public readonly identityId: string,
			public readonly apiKeyId: string,
			public readonly roles: string[]
		) {}
	}

	export class VerifyResultError {
		readonly valid = false

		constructor(public readonly error: VerifyErrorCode) {}
	}

	export const enum VerifyErrorCode {
		NOT_FOUND = 'not_found',
		DISABLED = 'disabled',
		EXPIRED = 'expired',
		NO_AUTH_HEADER = 'no_auth_header',
		INVALID_AUTH_HEADER = 'invalid_auth_header',
	}

	export type CreateApiKeyResponse = CreateApiKeyResponseOk | CreateApiKeyResponseError

	export class CreateApiKeyResponseOk {
		public readonly ok = true

		constructor(public readonly result: CreateApiKeyResult) {}
	}

	export class CreateApiKeyResponseError {
		public readonly ok = false

		constructor(public readonly errors: CreateApiKeyErrorCode[]) {}
	}

	export class CreateApiKeyResult {
		constructor(public readonly identityId: string, public readonly apiKey: CreateApiKey.Result) {}
	}
}

export default ApiKeyManager
