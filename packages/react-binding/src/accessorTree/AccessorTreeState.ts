import type { TreeRootAccessor } from '@contember/binding'
import { Environment } from '@contember/binding'
import { ReactNode } from 'react'
import { GraphQlClientError } from '@contember/react-client'

export interface InitializingAccessorTreeState {
	name: 'initializing'
	environment: Environment
}

export interface InitializedAccessorTreeState {
	name: 'initialized'
	environment: Environment
	data: TreeRootAccessor<ReactNode>
}

export interface ErrorAccessorTreeState {
	name: 'error'
	environment: Environment
	error: GraphQlClientError
}

export type AccessorTreeState =
	| InitializingAccessorTreeState
	| InitializedAccessorTreeState
	| ErrorAccessorTreeState
