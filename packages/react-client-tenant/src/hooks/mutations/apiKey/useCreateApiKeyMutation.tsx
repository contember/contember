import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType } from 'graphql-ts-client-api'
import { createTenantMutation } from '../../useTenantMutation'

const createApiKeyMutationResult = TenantApi.createApiKeyResult$.apiKey(TenantApi.apiKeyWithToken$$.identity(TenantApi.identity$$))

export type CreateApiKeyMutationResult = ModelType<typeof createApiKeyMutationResult>

export const createApiKeyMutation = TenantApi.mutation$
	.createApiKey(
		TenantApi
			.createApiKeyResponse$$
			.error(TenantApi.createApiKeyError$$.membershipValidation(TenantApi.membershipValidationError$$))
			.result(createApiKeyMutationResult),
		options => options.alias('mutation'),
	)

export const useCreateApiKeyMutation = createTenantMutation(createApiKeyMutation)
export type CreateApiKeyMutationVariables = Parameters<ReturnType<typeof useCreateApiKeyMutation>>[0]
