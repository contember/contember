import * as TenantApi from '@contember/graphql-client-tenant'
import { LoginToken } from '../../useTenantApi'
import { createTenantMutation } from '../../useTenantMutation'
import { ModelType } from 'graphql-ts-client-api'

const signInResultFragment = TenantApi.signInPasswordlessResult$$.person(TenantApi.person$$)

export type SignInPasswordlessMutationResult = ModelType<typeof signInResultFragment>

const SignInPasswordlessMutation = TenantApi
	.mutation$
	.signInPasswordless(
		TenantApi
			.signInPasswordlessResponse$$
			.error(TenantApi.signInPasswordlessError$$)
			.result(signInResultFragment),
		options => options.alias('mutation'),
	)

export const useSignInPasswordlessMutation = createTenantMutation(SignInPasswordlessMutation, {
	apiToken: LoginToken,
})

export type SignInPasswordlessMutationVariables = Parameters<ReturnType<typeof useSignInPasswordlessMutation>>[0]
