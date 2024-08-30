import * as TenantApi from '@contember/graphql-client-tenant'
import { LoginToken } from '../../useTenantApi'
import { createTenantMutation } from '../../useTenantMutation'
import { ModelType } from 'graphql-ts-client-api'

const InitSignInPasswordlessMutationResult = TenantApi.initSignInPasswordlessResult$$
export type InitSignInPasswordlessMutationResult = ModelType<typeof InitSignInPasswordlessMutationResult>
const InitSignInPasswordlessMutation = TenantApi
	.mutation$
	.initSignInPasswordless(
		TenantApi
			.initSignInPasswordlessResponse$$
			.error(TenantApi.initSignInPasswordlessError$$)
			.result(InitSignInPasswordlessMutationResult),
		options => options.alias('mutation'),
	)

export const useInitSignInPasswordlessMutation = createTenantMutation(InitSignInPasswordlessMutation, {
	apiToken: LoginToken,
})

export type InitSignInPasswordlessMutationVariables = Parameters<ReturnType<typeof useInitSignInPasswordlessMutation>>[0]
