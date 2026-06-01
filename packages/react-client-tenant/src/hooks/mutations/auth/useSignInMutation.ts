import * as TenantApi from '@contember/graphql-client-tenant'
import { LoginToken } from '../../useTenantApi.js'
import { ModelType } from 'graphql-ts-client-api'
import { createTenantMutation } from '../../useTenantMutation.js'

const signInResultFragment = TenantApi.signInResult$$.person(TenantApi.person$.id.email.name)

export type SignInMutationResult = ModelType<typeof signInResultFragment>

export const signInMutation = TenantApi
	.mutation$
	.signIn(
		TenantApi
			.signInResponse$$
			.error(TenantApi.signInError$$)
			.result(signInResultFragment),
		options => options.alias('mutation'),
	)

export const useSignInMutation = createTenantMutation(signInMutation, {
	apiToken: LoginToken,
})

export type SignInMutationVariables = Parameters<ReturnType<typeof useSignInMutation>>[0]
