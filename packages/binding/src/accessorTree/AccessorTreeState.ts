import type { TreeRootAccessor } from '../accessors'
import type { RequestError } from './RequestError'
import { DataBinding } from '../core'

export interface InitializingAccessorTreeState {
	binding: DataBinding
	name: 'initializing'
}

export interface InitializedAccessorTreeState {
	binding: DataBinding
	name: 'initialized'
	data: TreeRootAccessor
}

export interface ErrorAccessorTreeState {
	binding: DataBinding
	name: 'error'
	error: RequestError
}

export type AccessorTreeState = InitializingAccessorTreeState | InitializedAccessorTreeState | ErrorAccessorTreeState
