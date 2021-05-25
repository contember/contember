interface RequestStateBase<T> {
	data?: T
	loading: boolean
	finished: boolean
	error: boolean
}

export interface RequestStateOk<T> extends RequestStateBase<T> {
	data: T
	loading: false
	finished: true
	error: false
}

export interface RequestStateError<T> extends RequestStateBase<T> {
	data?: undefined
	loading: false
	finished: true
	error: true
}

export interface RequestStateError<T> extends RequestStateBase<T> {
	data?: undefined
	loading: false
	finished: true
	error: true
}

export interface RequestStateLoading<T> extends RequestStateBase<T> {
	data?: undefined
	loading: true
	finished: false
	error: false
}

export interface RequestStateUninitialized<T> extends RequestStateBase<T> {
	data?: undefined
	loading: false
	finished: false
	error: false
}

export type QueryRequestState<T> = RequestStateOk<T> | RequestStateError<T> | RequestStateLoading<T>
export interface QueryRequestObject<T> {
	state: QueryRequestState<T>
	refetch: () => void
}

export type MutationRequestState<T> =
	| RequestStateOk<T>
	| RequestStateError<T>
	| RequestStateLoading<T>
	| RequestStateUninitialized<T>
