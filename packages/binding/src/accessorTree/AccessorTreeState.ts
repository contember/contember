import type { TreeRootAccessor } from '../accessors'
import type { RequestError } from './RequestError'
import { DataBinding } from '../core'
import { Environment } from '../dao'

export interface InitializingAccessorTreeState {
	name: 'initializing'
	environment: Environment
	binding?: DataBinding
}

export interface InitializedAccessorTreeState {
	name: 'initialized'
	environment: Environment
	binding: DataBinding
	data: TreeRootAccessor
}

export interface ErrorAccessorTreeState {
	name: 'error'
	environment: Environment
	binding: DataBinding
	error: RequestError
}

export type AccessorTreeState =
	| InitializingAccessorTreeState
	| InitializedAccessorTreeState
	| ErrorAccessorTreeState
