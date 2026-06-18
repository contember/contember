import { ApiKey, QueryResolvers } from '../../schema/index.js'
import { TenantResolverContext } from '../TenantResolverContext.js'
import { PermissionActions } from '../../model/index.js'
import { GlobalApiKeysQuery } from '../../model/queries/apiKey/index.js'
import { ApiKeyResponseFactory } from '../responseHelpers/ApiKeyResponseFactory.js'

export class ApiKeyQueryResolver implements QueryResolvers {
	async globalApiKeys(parent: unknown, args: unknown, context: TenantResolverContext): Promise<readonly ApiKey[]> {
		if (!(await context.isAllowed({ action: PermissionActions.API_KEY_LIST }))) {
			return []
		}
		const rows = await context.db.queryHandler.fetch(new GlobalApiKeysQuery())
		return rows.map(row => ApiKeyResponseFactory.createApiKeyResponse(row))
	}
}
