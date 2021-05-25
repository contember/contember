import type { TreeRootAccessor } from '../accessors'
import type { RequestError } from './RequestError'

export enum AccessorTreeStateName {
	Initializing = 'initializing',
	Error = 'error',
	Initialized = 'initialized',
}

export interface InitializingAccessorTreeState {
	name: AccessorTreeStateName.Initializing
}

export interface InitializedAccessorTreeState {
	name: AccessorTreeStateName.Initialized
	data: TreeRootAccessor
}

export interface ErrorAccessorTreeState {
	name: AccessorTreeStateName.Error
	error: RequestError
}

export type AccessorTreeState = InitializingAccessorTreeState | InitializedAccessorTreeState | ErrorAccessorTreeState
