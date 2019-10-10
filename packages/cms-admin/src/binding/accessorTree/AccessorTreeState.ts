import { AccessorTreeRoot, MarkerTreeRoot } from '../dao'
import { SuccessfulPersistResult } from './PersistResult'
import { RequestError } from './RequestError'

export enum AccessorTreeStateName {
	Uninitialized = 'uninitialized',
	Querying = 'querying',
	RequestError = 'requestError',
	Interactive = 'ready',
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
	data: AccessorTreeRoot
	// This is really a no-op but we want to avoid having to un-render all e.g. persist buttons
	triggerPersist: () => Promise<SuccessfulPersistResult>
	isDirty: boolean
}

export interface InteractiveAccessorTreeState {
	name: AccessorTreeStateName.Interactive
	data: AccessorTreeRoot
	triggerPersist: () => Promise<SuccessfulPersistResult>
	isDirty: boolean
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

//export type AccessorTreeGlobalStateById = {
//	[Id in MarkerTreeRoot.TreeId]: any
//}
