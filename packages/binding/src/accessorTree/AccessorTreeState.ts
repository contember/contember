import type { TreeRootAccessor } from '../accessors'
import type { RequestError } from './RequestError'

export interface InitializingAccessorTreeState {
	name: 'initializing'
}

export interface InitializedAccessorTreeState {
	name: 'initialized'
	data: TreeRootAccessor
}

export interface ErrorAccessorTreeState {
	name: 'error'
	error: RequestError
}

export type AccessorTreeState = InitializingAccessorTreeState | InitializedAccessorTreeState | ErrorAccessorTreeState
