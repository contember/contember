export interface RequestStateOk<T> {
	data: T
	extensions?: any
	state: 'success'
}

export interface RequestStateError<T> {
	state: 'error'
	error: any
}

export interface RequestStateLoading<T>  {
	state: 'loading'
}

export interface RequestStateUninitialized<T> {
	state: 'initial'
}

export type QueryRequestState<T> =
	| RequestStateOk<T>
	| RequestStateError<T>
	| RequestStateLoading<T>

export interface QueryRequestObject<T> {
	state: QueryRequestState<T>
	refetch: () => void
}

export type MutationRequestState<T> =
	| QueryRequestState<T>
	| RequestStateUninitialized<T>
