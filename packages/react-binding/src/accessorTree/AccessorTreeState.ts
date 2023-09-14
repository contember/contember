import type { TreeRootAccessor } from '@contember/binding'
import type { RequestError } from '@contember/binding'
import { DataBinding } from '@contember/binding'
import { Environment } from '@contember/binding'
import { ReactNode } from 'react'

export interface InitializingAccessorTreeState {
	name: 'initializing'
	environment: Environment
	binding?: DataBinding<ReactNode>
}

export interface InitializedAccessorTreeState {
	name: 'initialized'
	environment: Environment
	binding: DataBinding<ReactNode>
	data: TreeRootAccessor<ReactNode>
}

export interface ErrorAccessorTreeState {
	name: 'error'
	environment: Environment
	binding: DataBinding<ReactNode>
	error: RequestError
}

export type AccessorTreeState =
	| InitializingAccessorTreeState
	| InitializedAccessorTreeState
	| ErrorAccessorTreeState
