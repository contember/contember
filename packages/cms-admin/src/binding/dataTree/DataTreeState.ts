export type DataTreeId = string

export type DataTreeDirtinessState = boolean

export type DataTreeMutationState = boolean

export enum DataTreeRequestReadyState {
	Uninitialized = 'Uninitialized',
	Pending = 'Pending',
	Success = 'Success',
	Error = 'Error',
}

export type DataTreeRequestSuccessData = any
export type DataTreeRequestErrorData = any

export type DataTreeRequestState<
	SuccessData extends DataTreeRequestSuccessData = DataTreeRequestSuccessData,
	ErrorData extends DataTreeRequestErrorData = DataTreeRequestErrorData
> =
	| {
			readyState: DataTreeRequestReadyState.Uninitialized | DataTreeRequestReadyState.Pending
	  }
	| {
			readyState: DataTreeRequestReadyState.Success
			data: SuccessData
	  }
	| {
			readyState: DataTreeRequestReadyState.Error
			data: ErrorData
	  }

export enum DataTreeRequestType {
	Query = 'query',
	Mutation = 'mutation',
}

export type DataTreeRequestList = { [Type in DataTreeRequestType]: DataTreeRequestState }

export interface DataTreeState {
	isDirty: DataTreeDirtinessState
	isMutating: DataTreeMutationState
	requests: DataTreeRequestList
}
