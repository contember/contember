import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType } from 'graphql-ts-client-api'
import { createTenantMutation } from '../../useTenantMutation'

const createSessionTokenMutationResult = TenantApi.createSessionTokenResult$.token.person(TenantApi.person$.id.email.name)

export type CreateSessionTokenMutationResult = ModelType<typeof createSessionTokenMutationResult>

export const createSessionTokenMutation = TenantApi.mutation$
	.createSessionToken(
		TenantApi
			.createSessionTokenResponse$$
			.error(TenantApi.createSessionTokenError$$)
			.result(createSessionTokenMutationResult),
		options => options.alias('mutation'),
	)

export const useCreateSessionTokenMutation = createTenantMutation(createSessionTokenMutation)
export type CreateSessionTokenMutationVariables = Parameters<ReturnType<typeof useCreateSessionTokenMutation>>[0]
