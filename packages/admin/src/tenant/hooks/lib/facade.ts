import { JsonValue } from '../../../utils'
import { useCallback } from 'react'
import { useTenantGraphQlClient } from '@contember/react-client'

export interface GQLVariableType<Value = any, Required extends boolean = boolean> {
	graphQlType: string
	required: Required
}

export namespace GQLVariable {
	export const Json: GQLVariableType<JsonValue<undefined>, false> = { graphQlType: 'Json', required: false }
	export const String: GQLVariableType<string, false> = { graphQlType: 'String', required: false }
	export const Required = <V extends any>(type: GQLVariableType<V, boolean>): GQLVariableType<V, true> => ({
		graphQlType: type.graphQlType + '!',
		required: true,
	})
	export const List = <V extends any>(type: GQLVariableType<V, false>): GQLVariableType<V[], false> => ({
		graphQlType: `[${type.graphQlType}!]`,
		required: false,
	})
}

export type TenantMutationExecutor<VariableValues extends any, Res extends TenantMutationResponse<any, string>> =
	(variables: VariableValues) => Promise<Res>

export const useSingleTenantMutation = <
	Result extends JsonValue,
	ErrorCode extends string,
	Variables extends Record<string, GQLVariableType<any, any>>
	>(mutation: string, variableDefinitions: Variables): TenantMutationExecutor<VariableValues<Variables>, TenantMutationResponse<Result, ErrorCode>> => {

	const client = useTenantGraphQlClient()

	return useCallback(async variables => {
		const formattedVariables = Object.entries(variableDefinitions).map(([name, type]) => `$${name}: ${type.graphQlType}`).join(', ')
		const response = await client.sendRequest< { data: { result: TenantMutationResponse<Result, ErrorCode>}, errors? : any }>(`
			mutation${formattedVariables ? `(${formattedVariables})` : ''} {
				result: ${mutation}
			}
		`, { variables })
		if (response.errors) {
			throw response.errors
		}
		return response.data.result
	}, [client, mutation, variableDefinitions])
}

export interface TenantMutationErrorResponse<Code extends string> {
	ok: false
	error: {
		code: Code
		developerMessage: string
	}
}
export interface TenantMutationOkResponse<Result extends JsonValue> {
	ok: true
	result: Result
}

export type TenantMutationResponse<Result extends JsonValue, ErrorCode extends string> =
	| TenantMutationErrorResponse<ErrorCode>
	| TenantMutationOkResponse<Result>

type KeysMatching<T, V> = NonNullable<{ [K in keyof T]: T[K] extends V ? K : never }[keyof T]>

type VariableValues<VariableMap extends Record<string, GQLVariableType>> = {
	[K in KeysMatching<VariableMap, GQLVariableType<any, true>>]: VariableMap[K] extends GQLVariableType<infer Value, boolean> ? Value : never
} & {
	[K in KeysMatching<VariableMap, GQLVariableType<any, false>>]?: VariableMap[K] extends GQLVariableType<infer Value, boolean> ? Value : never
}
