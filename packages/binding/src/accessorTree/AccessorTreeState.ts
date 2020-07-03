import { TreeRootAccessor } from '../accessors'
import { SuccessfulPersistResult } from './PersistResult'
import { RequestError } from './RequestError'

export enum AccessorTreeStateName {
	Uninitialized = 'uninitialized',
	Querying = 'querying',
	RequestError = 'requestError',
	Interactive = 'interactive',
	Mutating = 'mutating',
}

export interface UninitializedAccessorTreeState {
	name: AccessorTreeStateName.Uninitialized
}

export interface QueryingAccessorTreeState {
	name: AccessorTreeStateName.Querying
}

export interface MutatingAccessorTreeState {
	name: AccessorTreeStateName.Mutating
	data: TreeRootAccessor
	// This is really a no-op but we want to avoid having to un-render all e.g. persist buttons
	triggerPersist: () => Promise<SuccessfulPersistResult>
}

export interface InteractiveAccessorTreeState {
	name: AccessorTreeStateName.Interactive
	data: TreeRootAccessor
	triggerPersist: () => Promise<SuccessfulPersistResult>
}

export interface RequestErrorAccessorTreeState {
	name: AccessorTreeStateName.RequestError
	error: RequestError
}

export type AccessorTreeState =
	| UninitializedAccessorTreeState
	| QueryingAccessorTreeState
	| MutatingAccessorTreeState
	| RequestErrorAccessorTreeState
	| InteractiveAccessorTreeState
