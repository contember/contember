import type { TreeRootAccessor } from '@contember/binding'
import { DataBinding, Environment } from '@contember/binding'
import { ReactNode } from 'react'
import { GraphQlClientError } from '@contember/react-client'

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
	error: GraphQlClientError
}

export type AccessorTreeState =
	| InitializingAccessorTreeState
	| InitializedAccessorTreeState
	| ErrorAccessorTreeState
