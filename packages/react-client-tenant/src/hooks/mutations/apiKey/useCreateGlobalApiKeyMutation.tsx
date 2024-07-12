import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType } from 'graphql-ts-client-api'
import { createTenantMutation } from '../../useTenantMutation'

const createGlobalApiKeyMutationResult = TenantApi.createApiKeyResult$.apiKey(TenantApi.apiKeyWithToken$$.identity(TenantApi.identity$$))

export type CreateGlobalApiKeyMutationResult = ModelType<typeof createGlobalApiKeyMutationResult>

export const createGlobalApiKeyMutation = TenantApi.mutation$
	.createGlobalApiKey(
		TenantApi
			.createApiKeyResponse$$
			.error(TenantApi.createApiKeyError$$)
			.result(createGlobalApiKeyMutationResult),
		options => options.alias('mutation'),
	)

export const useCreateGlobalApiKeyMutation = createTenantMutation(createGlobalApiKeyMutation)
export type CreateGlobalApiKeyMutationVariables = Parameters<ReturnType<typeof useCreateGlobalApiKeyMutation>>[0]
