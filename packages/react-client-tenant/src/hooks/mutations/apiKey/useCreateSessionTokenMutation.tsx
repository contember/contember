import * as TenantApi from '@contember/graphql-client-tenant'
import { useCallback } from 'react'
import { ModelType, ParameterRef } from 'graphql-ts-client-api'
import { TenantApiOptions } from '../../useTenantApi.js'
import { createTenantMutation, TenantMutationResponse } from '../../useTenantMutation.js'

const createSessionTokenMutationResult = TenantApi.createSessionTokenResult$.token.person(TenantApi.person$.id.email.name)

export type CreateSessionTokenMutationResult = ModelType<typeof createSessionTokenMutationResult>

const createSessionTokenResponseFragment = TenantApi
	.createSessionTokenResponse$$
	.error(TenantApi.createSessionTokenError$.code.developerMessage)
	.result(createSessionTokenMutationResult)

// Explicit arguments, not the generated defaults: engines before 2.2 have no `SignInOptions` input.
export const createSessionTokenMutation = TenantApi.mutation$
	.createSessionToken(
		{
			email: ParameterRef.of('email'),
			personId: ParameterRef.of('personId'),
			expiration: ParameterRef.of('expiration'),
		},
		createSessionTokenResponseFragment,
		options => options.alias('mutation'),
	)

// Declares `options` as well; used only when the caller sets it, which an older engine rejects anyway.
const createSessionTokenWithOptionsMutation = TenantApi.mutation$
	.createSessionToken(
		{
			email: ParameterRef.of('email'),
			personId: ParameterRef.of('personId'),
			expiration: ParameterRef.of('expiration'),
			options: ParameterRef.of('options'),
		},
		createSessionTokenResponseFragment,
		options => options.alias('mutation'),
	)

export type CreateSessionTokenMutationVariables = TenantApi.MutationArgs['createSessionToken']

const useCreateSessionTokenFetcherMutation = createTenantMutation(createSessionTokenMutation)

const useCreateSessionTokenWithOptionsFetcherMutation = createTenantMutation(createSessionTokenWithOptionsMutation)

export const useCreateSessionTokenMutation = (options?: TenantApiOptions) => {
	const createSessionToken = useCreateSessionTokenFetcherMutation(options)
	const createSessionTokenWithOptions = useCreateSessionTokenWithOptionsFetcherMutation(options)
	return useCallback(
		(
			variables: CreateSessionTokenMutationVariables,
		): Promise<TenantMutationResponse<CreateSessionTokenMutationResult, TenantApi.CreateSessionTokenErrorCode>> => {
			const { email, personId, expiration, options: signInOptions } = variables
			if (signInOptions !== undefined) {
				return createSessionTokenWithOptions({ email, personId, expiration, options: signInOptions })
			}
			return createSessionToken({ email, personId, expiration })
		},
		[createSessionToken, createSessionTokenWithOptions],
	)
}
