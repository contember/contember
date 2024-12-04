import { ContentMutation, ContentQuery, QueryExecutorOptions } from '@contember/client-content'

export interface BaseOptions extends QueryExecutorOptions {
	onSuccess?: (data: any) => void
	onError?: (error: Error) => void
}

export interface QueryOptions<T> extends BaseOptions {
	onSuccess?: (data: T) => void
}

export interface MutationOptions<T> extends BaseOptions {
	onSuccess?: (data: T) => void
}

export interface QueryResult<T> {
	data: T | undefined
	error: Error | null
	isLoading: boolean
}

export interface QueryOverloads {
	<Value>(query: ContentQuery<Value>, options?: QueryOptions<Value>): QueryResult<Value>
	<Values extends Record<string, any>>(
		queries: { [K in keyof Values]: ContentQuery<Values[K]> },
		options?: QueryOptions<Values>
	): QueryResult<Values>
}

export interface MutationOverloads {
	<Value, Variables extends Record<string, any>>(
		mutationFn: (variables: Variables) => ContentMutation<Value>,
		options?: MutationOptions<Value>
	): { mutate: (variables: Variables) => Promise<Value>; isLoading: boolean }

	<Value, Variables extends Record<string, any>>(
		mutationFn: (variables: Variables) => ContentMutation<Value>[],
		options?: MutationOptions<Value[]>
	): { mutate: (variables: Variables) => Promise<Value[]>; isLoading: boolean }

	<Values extends Record<string, any>, Variables extends Record<string, any>>(
		mutationFn: (variables: Variables) => { [K in keyof Values]: ContentMutation<Values[K]> | ContentQuery<Values[K]> },
		options?: MutationOptions<Values>
	): { mutate: (variables: Variables) => Promise<Values>; isLoading: boolean }
}
