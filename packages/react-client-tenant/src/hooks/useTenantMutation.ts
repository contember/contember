import { TenantApiOptions, useTenantApi } from './useTenantApi'
import { useCallback, useMemo } from 'react'
import { MutationFetcher } from '@contember/graphql-client-tenant'

export type TenantMutationOkResponse<Result> = { ok: true; result: Result }
export type TenantMutationErrorResponse<Error> = { ok: false; error: Error; developerMessage?: string }
export type TenantMutationResponse<Result, Error> = TenantMutationOkResponse<Result> | TenantMutationErrorResponse<Error>

export type TenantMutation<Result, Error> = { readonly mutation?: { readonly ok: boolean; readonly error?: { readonly code: Error; readonly developerMessage: string}; readonly result?: Result} }

export const useTenantMutation = <TResult, TError extends string = never, TVariables extends object = {}>(
	fetcher: MutationFetcher<TenantMutation<TResult, TError>, TVariables>,
	{ headers, apiToken }: TenantApiOptions = {},
) => {
	const tenantApi = useTenantApi({ headers, apiToken })

	return useCallback(async (variables: TVariables): Promise<TenantMutationResponse<TResult, TError>> => {
		const result = await tenantApi(
			fetcher,
			{
				variables,
			},
		)
		if (!result.mutation?.ok) {
			return {
				ok: false,
				error: result.mutation?.error?.code as TError,
				developerMessage: result.mutation?.error?.developerMessage,
			}
		} else {
			return { ok: true, result: result.mutation.result as TResult }
		}
	}, [fetcher, tenantApi])
}


export const createTenantMutation = <TResult, TError extends string = never, TVariables extends object = {}>(
	fetcher: MutationFetcher<TenantMutation<TResult, TError>, TVariables>,
	defaultOptions?: TenantApiOptions,
) => {
	return ({ headers, apiToken }: TenantApiOptions = {}) => useTenantMutation(fetcher, {
		headers: useMemo(() => ({ ...defaultOptions?.headers, ...headers }), [headers]),
		apiToken: apiToken ?? defaultOptions?.apiToken,
	})
}
