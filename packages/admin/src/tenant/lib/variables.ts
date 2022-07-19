import { JsonValue } from '@contember/binding'

export interface GQLVariableType<Value = any, Required extends boolean = boolean> {
	graphQlType: string
	required: Required
}

export namespace GQLVariable {
	export const Json: GQLVariableType<JsonValue<undefined>, false> = { graphQlType: 'Json', required: false }
	export const String: GQLVariableType<string, false> = { graphQlType: 'String', required: false }
	export const Int: GQLVariableType<number, false> = { graphQlType: 'Int', required: false }

	export const Required = <V extends any>(type: GQLVariableType<V, boolean>): GQLVariableType<V, true> => ({
		graphQlType: type.graphQlType + '!',
		required: true,
	})

	export const List = <V extends any>(type: GQLVariableType<V, false>): GQLVariableType<V[], false> => ({
		graphQlType: `[${type.graphQlType}!]`,
		required: false,
	})

	export const Enum = <V extends string>(name: string): GQLVariableType<V, false> => ({
		graphQlType: name,
		required: false,
	})
}

type KeysMatching<T, V> = NonNullable<{ [K in keyof T]: T[K] extends V ? K : never }[keyof T]>

export type GQLVariableValues<VariableMap extends Record<string, GQLVariableType>> = {
	[K in KeysMatching<VariableMap, GQLVariableType<any, true>>]: VariableMap[K] extends GQLVariableType<infer Value, boolean> ? Value : never
} & {
	[K in KeysMatching<VariableMap, GQLVariableType<any, false>>]?: VariableMap[K] extends GQLVariableType<infer Value, boolean> ? Value : never
}
