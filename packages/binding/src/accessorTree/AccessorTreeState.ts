import { GetEntityByKey, RootAccessor } from '../accessors'
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
	getEntityByKey: GetEntityByKey // This is a no-op
}

export interface QueryingAccessorTreeState {
	name: AccessorTreeStateName.Querying
	getEntityByKey: GetEntityByKey // This is a no-op
}

export interface MutatingAccessorTreeState {
	name: AccessorTreeStateName.Mutating
	data: RootAccessor
	getEntityByKey: GetEntityByKey
	// This is really a no-op but we want to avoid having to un-render all e.g. persist buttons
	triggerPersist: () => Promise<SuccessfulPersistResult>
	isDirty: boolean
}

export interface InteractiveAccessorTreeState {
	name: AccessorTreeStateName.Interactive
	data: RootAccessor
	getEntityByKey: GetEntityByKey
	triggerPersist: () => Promise<SuccessfulPersistResult>
	isDirty: boolean
}

export interface RequestErrorAccessorTreeState {
	name: AccessorTreeStateName.RequestError
	getEntityByKey: GetEntityByKey // This is a no-op
	error: RequestError
}

export type AccessorTreeState =
	| UninitializedAccessorTreeState
	| QueryingAccessorTreeState
	| MutatingAccessorTreeState
	| RequestErrorAccessorTreeState
	| InteractiveAccessorTreeState

export type AccessorTreeStateWithData = MutatingAccessorTreeState | InteractiveAccessorTreeState

//export type AccessorTreeGlobalStateById = {
//	[Id in MarkerTreeRoot.TreeId]: any
//}
