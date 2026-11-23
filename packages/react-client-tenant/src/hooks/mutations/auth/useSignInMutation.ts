import * as TenantApi from '@contember/graphql-client-tenant'
import { useCallback } from 'react'
import { LoginToken, TenantApiOptions } from '../../useTenantApi.js'
import { ModelType, ParameterRef } from 'graphql-ts-client-api'
import { createTenantMutation, TenantMutationResponse } from '../../useTenantMutation.js'

// Explicit fields and arguments, not `$$` and the generated defaults: password sign-in must work against older engines too,
// which have neither `SignInResult.backupCodes`, `SignInError.retryAfter` (< 2.1), the `backupCode` argument nor `SignInOptions`.
const signInResultFragment = TenantApi.signInResult$.token.person(TenantApi.person$.id.email.name)

export type SignInMutationResult = ModelType<typeof signInResultFragment>

const signInResponseFragment = TenantApi
	.signInResponse$$
	.error(TenantApi.signInError$.code.developerMessage)
	.result(signInResultFragment)

export const signInMutation = TenantApi
	.mutation$
	.signIn(
		{
			email: ParameterRef.of('email'),
			password: ParameterRef.of('password'),
			expiration: ParameterRef.of('expiration'),
			otpToken: ParameterRef.of('otpToken'),
		},
		signInResponseFragment,
		options => options.alias('mutation'),
	)

// Declares `backupCode` and `options` as well; used only when the caller sets one of them, which an older engine rejects anyway.
const signInWithNewerArgumentsMutation = TenantApi
	.mutation$
	.signIn(
		{
			email: ParameterRef.of('email'),
			password: ParameterRef.of('password'),
			expiration: ParameterRef.of('expiration'),
			otpToken: ParameterRef.of('otpToken'),
			backupCode: ParameterRef.of('backupCode'),
			options: ParameterRef.of('options'),
		},
		signInResponseFragment,
		options => options.alias('mutation'),
	)

export type SignInMutationVariables = TenantApi.MutationArgs['signIn']

const useSignInFetcherMutation = createTenantMutation(signInMutation, {
	apiToken: LoginToken,
})

const useSignInWithNewerArgumentsFetcherMutation = createTenantMutation(signInWithNewerArgumentsMutation, {
	apiToken: LoginToken,
})

export const useSignInMutation = (options?: TenantApiOptions) => {
	const signIn = useSignInFetcherMutation(options)
	const signInWithNewerArguments = useSignInWithNewerArgumentsFetcherMutation(options)
	return useCallback(
		(variables: SignInMutationVariables): Promise<TenantMutationResponse<SignInMutationResult, TenantApi.SignInErrorCode>> => {
			const { email, password, expiration, otpToken, backupCode, options: signInOptions } = variables
			if (backupCode !== undefined || signInOptions !== undefined) {
				return signInWithNewerArguments({ email, password, expiration, otpToken, backupCode, options: signInOptions })
			}
			return signIn({ email, password, expiration, otpToken })
		},
		[signIn, signInWithNewerArguments],
	)
}
