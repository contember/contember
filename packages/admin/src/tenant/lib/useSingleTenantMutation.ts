import { useCallback } from 'react'
import { GraphQlClientRequestOptions, useTenantGraphQlClient } from '@contember/react-client'
import { GQLVariableType, GQLVariableValues } from './variables'


export type TenantMutationExecutor<VariableValues extends any, Res extends TenantMutationResponse<any, string>> =
	(variables: VariableValues, option?: { onResponse?: (response: any) => void }) => Promise<Res>

export const useSingleTenantMutation = <
	Result extends any,
	ErrorCode extends string,
	Variables extends Record<string, GQLVariableType<any, any>>
	>(
		mutation: string,
		variableDefinitions: Variables,
		options?: Omit<GraphQlClientRequestOptions, 'variables'>,
): TenantMutationExecutor<GQLVariableValues<Variables>, TenantMutationResponse<Result, ErrorCode>> => {

	const client = useTenantGraphQlClient()

	return useCallback(async (variables, queryOptions) => {
		const formattedVariables = Object.entries(variableDefinitions).map(([name, type]) => `$${name}: ${type.graphQlType}`).join(', ')
		const gql = `
			mutation${formattedVariables ? `(${formattedVariables})` : ''} {
				result: ${mutation}
			}
		`
		const response = await client.sendRequest<{ data: { result: TenantMutationResponse<Result, ErrorCode> }, errors?: any }>(gql, { variables, ...options })
		queryOptions?.onResponse?.(response)
		if (response.errors) {
			throw response.errors
		}
		return response.data.result
	}, [client, mutation, options, variableDefinitions])
}

export interface TenantMutationErrorResponse<Code extends string> {
	ok: false
	error: {
		code: Code
		developerMessage: string
	}
}
export interface TenantMutationOkResponse<Result> {
	ok: true
	result: Result
}

export type TenantMutationResponse<Result, ErrorCode extends string> =
	| TenantMutationErrorResponse<ErrorCode>
	| TenantMutationOkResponse<Result>

